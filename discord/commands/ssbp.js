const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');
const bedrock = require('bedrock-protocol');
const { RealmAPI } = require('prismarine-realms');
const { Authflow } = require('prismarine-auth');
const { setTimeout } = require('timers/promises');
const skinData = require('../../data/ssbp.json');
const { NIL, v3: uuidv3, v4: uuidv4 } = require('uuid');
const { cat1, error, loading, replystart, replyend } = require('../../data/emojie');
const { discordInvite, footer } = require('../../data/config');
const { checkAndSaveRealm,saveCoins } = require('../functions/realms.js');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('ssbp')
        .setDescription('Sends broken Packets to a Realm.')
        .addStringOption(option =>
            option.setName('realmcode')
                .setDescription('The Realm Code of the Realm.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in seconds to stay connected to the Realm.')
                .setRequired(true)
                .setMinValue(5)
                .setMaxValue(500)
            )
        .addStringOption(option =>
            option.setName('namespoof_name')
                .setDescription('The Name you want to use for Namespoof (Premium only)')
                .setRequired(false)),
    execute: async (interaction) => {
        await interaction.deferReply();

        try {
            const realmCode = interaction.options.getString('realmcode');
            const duration = interaction.options.getInteger('duration');
            const name = interaction.options.getString('namespoof_name') || discordInvite;
            const userId = interaction.user.id;
            const profilesFolder = `./authCache/${userId}`;

            if (!fs.existsSync(profilesFolder)) {
                await interaction.editReply({
                    embeds: [
                        {
                            title: `${error} Account Not Linked ${error}`,
                            description: `It seems like you haven't linked an account yet.\nPlease link an account with ` + '`/link `' + `to use this command.`,
                            color: 0xff0000,
                            footer: { text: footer },
                        },
                    ],
                });
                return;
            }

            const baseCoins = 20;
            const bonusCoins = Math.floor(duration / 60) * 100;
            const totalCoins = baseCoins + bonusCoins;

            

            const authFlow = new Authflow(undefined, profilesFolder, { authTitle: '00000000441cc96b', flow: 'live' });
            const realms = RealmAPI.from(authFlow, 'bedrock');
            const realm = await realms.getRealmFromInvite(realmCode);
            const realmName = realm?.name || 'Unknown';

            const embed = {
                title: `${cat1} Connecting to Realm: ${realmName} ${cat1}`,
                description: `You will earn **${totalCoins} coins**.`,
                footer: { text: 'Attempting connection...' },
            };
            await interaction.editReply({ embeds: [embed] });

            const client = bedrock.createClient({
                profilesFolder,
                offline: false,
                skinData: {
                    CurrentInputMode: 3,
                    DefaultInputMode: 3,
                    DeviceOS: 11,
                    DeviceId: uuidv3(uuidv4(), NIL),
                    PlatformOnlineId: generateRandomString(19, '1234567890'),
                    PrimaryUser: false,
                    SelfSignedId: uuidv4(),
                    ThirdPartyName: name,
                    ThirdPartyNameOnly: true,
                    TrustedSkin: true,
                    ...skinData,
                },
                skipPing: true,
                realms: {
                    [realmCode.length === 8 ? 'realmId' : 'realmInvite']: realmCode,
                },
            });

            client.on('join', async () => {
                checkAndSaveRealm(realmCode, userId);
                saveCoins(userId, totalCoins); 
                const disconnectTime = Date.now() + duration * 1000;
                const updatedEmbed = {
                    title: `${cat1} Connected to: ${realmName} ${cat1}`,
                    description: `${replystart}Successfully joined the Realm as ${name}\n${replyend}Realm Code: ${realmCode}`,
                    fields: [
                        { name: 'Leaving in', value: `<t:${Math.floor(disconnectTime / 1000)}:R>`, inline: false },
                        { name: 'Coins Earned', value: `**${totalCoins} coins**`, inline: false },
                    ],
                    footer: {
                        text: `${interaction.user.username} | discord.gg/frosted`,
                        iconURL: interaction.user.displayAvatarURL(),
                    },
                };
                await interaction.editReply({ embeds: [updatedEmbed] });
            });

            client.on('error', async (err) => {
                console.error(err);
                await interaction.followUp({
                    embeds: [
                        {
                            title: 'Error Occurred',
                            description: 'An error occurred while connecting to the Realm.',
                            color: 0xff0000,
                            fields: [
                                { name: 'Reason', value: err.message || 'Unknown error' },
                            ],
                            footer: {
                                text: `${interaction.user.username} | discord.gg/frosted`,
                                iconURL: interaction.user.displayAvatarURL(),
                            },
                        },
                    ],
                });
            });

            await setTimeout(duration * 1000);
            client.disconnect();
        } catch (error) {
            console.error(error);
            const errorEmbed = {
                title: 'Error Occurred',
                description: 'The bot encountered an issue while joining the Realm.',
                color: 0xff0000,
                fields: [
                    { name: 'Reason', value: error.message || 'Unknown error', inline: false },
                ],
                footer: { text: 'Please verify the Realm code and your account credentials.' },
            };
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};

function generateRandomString(length, charSet) {
    if (!charSet) charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_-';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }
    return result;
}


