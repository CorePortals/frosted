const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');
const bedrock = require('bedrock-protocol');
const { RealmAPI } = require('prismarine-realms');
const { Authflow } = require('prismarine-auth');
const { setTimeout } = require('timers/promises');
const skinData = require('../../data/ssbp.json');
const { NIL, v3: uuidv3, v4: uuidv4 } = require('uuid');
const { cat1, error, replystart, replyend } = require('../../data/emojie');
const { discordInvite, footer } = require('../../data/config');
const { checkAndSaveRealm } = require('../functions/realms.js');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('ssbp')
        .setDescription('Send a Fake Message/Messages with Name Spoof')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addStringOption(option =>
            option.setName('realmcode')
                .setDescription('The Realm Code of the Realm.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('messages')
                .setDescription('Messages to send, separated by ";" (e.g., "msg1;msg2").')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Number of times to send the messages.')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(50000)
            )
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name Spoof Name.')
                .setRequired(true)),
    execute: async (interaction) => {
        await interaction.deferReply();

        try {
            const realmCode = interaction.options.getString('realmcode');
            const duration = 20;
            const messagesInput = interaction.options.getString('messages');
            const messageCount = interaction.options.getInteger('count');
            const name = interaction.options.getString('name') || ""
            const userId = interaction.user.id;
            const profilesFolder = `./authCache/${userId}`;

            // Validate profiles folder existence
            if (!fs.existsSync(profilesFolder)) {
                await interaction.editReply({
                    embeds: [
                        {
                            title: `${error} Account Not Linked ${error}`,
                            description: `You haven't linked an account yet. Use \`/link\` to link an account.`,
                            color: 0xff0000,
                            footer: {
                                text: `${interaction.user.username} | discord.gg/frosted`,
                                iconURL: interaction.user.displayAvatarURL(),
                            },
                        },
                    ],
                });
                return;
            }

            const authFlow = new Authflow(undefined, profilesFolder, { authTitle: '00000000441cc96b', flow: 'live' });
            const realms = RealmAPI.from(authFlow, 'bedrock');
            const realm = await realms.getRealmFromInvite(realmCode);
            const realmName = realm?.name || 'Unknown';

            const embed = {
                title: `${cat1} Connecting to Realm: ${realmName} ${cat1}`,
                description: '',
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
                },
                skipPing: true,
                realms: { realmInvite: realmCode },
            });

            client.on('join', async () => {
                checkAndSaveRealm(realmCode, userId)
                    try {
                        const updatedEmbed = {
                            title: `${cat1} Connected to: ${realmName} ${cat1}`,
                            description: `${replystart}Successfully joined the Realm as ${name}\n${replyend}Realm Code: ${realmCode}`,
                            footer: { text: footer },
                        };
                        await interaction.editReply({ embeds: [updatedEmbed] });
                        console.log(`Connected to Realm: ${realmName} (${realmCode})`)
                    } catch (error) {
                        console.error(`Error Realm: ${error.message}`)
                    }
                });

            client.on('spawn', async () => {
                const messages = messagesInput.split(';');
                //console.log(`[Debug]Messages send ${messages} Count= ${messageCount}`)

                for (let i = 0; i < messageCount; i++) {
                    for (const message of messages) {
                        client.write("text", {
                            filtered_message: "",
                            type: "chat",
                            needs_translation: false,
                            source_name: client.profile.name,
                            message: message,
                            xuid: "0",
                            platform_chat_id: "0"
                        });
                        //console.log(`[Debug]Sent message ${message}`)
                        await setTimeout(0); 
                    }
                }

            });

            client.on('kick', async (packet) => {
                let reason = packet?.reason || 'Unknown reason';
                await interaction.editReply({
                    embeds: [
                        {
                            title: 'Client Kicked',
                            description: 'Client got kicked from the Realm.',
                            color: 0xffa500,
                            fields: [{ name: 'Reason', value: reason }],
                        },
                    ],
                    footer: {
                        text: `${interaction.user.username} | discord.gg/frosted`,
                        iconURL: interaction.user.displayAvatarURL(),
                    },
                });
            });

            client.on('error', async (err) => {
                console.error(err);
                await interaction.followUp({
                    embeds: [
                        {
                            title: 'Error Occurred',
                            description: 'An error occurred while connecting to the Realm.',
                            color: 0xff0000,
                            fields: [{ name: 'Reason', value: err.message || 'Unknown error' }],
                        },
                    ],
                    footer: {
                        text: `${interaction.user.username} | discord.gg/frosted`,
                        iconURL: interaction.user.displayAvatarURL(),
                    },
                });
            });

            await setTimeout(duration * 1000);
            client.disconnect();
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                embeds: [
                    {
                        title: 'Error Occurred',
                        description: 'The bot encountered an issue while joining the Realm.',
                        color: 0xff0000,
                        fields: [{ name: 'Reason', value: error.message || 'Unknown error' }],
                        footer: {
                            text: `${interaction.user.username} | discord.gg/frosted`,
                            iconURL: interaction.user.displayAvatarURL(),
                        },
                    },
                ],
            });
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