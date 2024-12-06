const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { Authflow: PrismarineAuth, Titles } = require('prismarine-auth');
const { RealmAPI } = require('prismarine-realms');

const databasePath = path.join(__dirname, '..', '..', 'data', 'database.json');
const whitelistPath = path.join(__dirname, '..', '..', 'data', 'whitelist.json');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('summaryinfo')
        .setDescription('See how many Realm Codes we have in the Realmlist and Database.'),

    execute: async (interaction) => {
        const userId = interaction.user.id;

        try {
            await interaction.deferReply();

            const databaseData = await fs.readFile(databasePath, 'utf-8');
            const whitelistData = await fs.readFile(whitelistPath, 'utf-8');

            const database = databaseData.trim() ? JSON.parse(databaseData) : { realms: [] };
            const whitelist = whitelistData.trim() ? JSON.parse(whitelistData) : { whitelist: [] };

            const databaseCount = database.realms.length;  
            const whitelistCount = whitelist.whitelist.length; 

            const authflow = await new PrismarineAuth(undefined, "./auth", { 
                flow: "live", 
                authTitle: Titles.MinecraftNintendoSwitch, 
                deviceType: "Nintendo", 
                doSisuAuth: true 
            });
            const api = RealmAPI.from(authflow, 'bedrock');
            const realmsList = await api.getRealms();
            const realmCount = realmsList.length;
            const onlineRealms = realmsList.filter(realm => realm.state === 'OPEN').length;
            const offlineRealms = realmCount - onlineRealms;

            // Building the response embed
            const embed = new EmbedBuilder()
                .setTitle('Realms Count:')
                .setDescription(`\n\nDatabase Codes: ${databaseCount}\nWhitelist Codes: ${whitelistCount}\nTotal Realms (API Acc): ${realmCount}\nOnline Realms: ${onlineRealms}\nOffline Realms: ${offlineRealms}`)
                .setFooter({
                    text: `${interaction.user.username} | discord.gg/frosted`,
                    iconURL: interaction.user.displayAvatarURL(),
                })

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error responding to interaction:', error);
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription(`'An error occurred while processing your request:'} ${error.message}`);

            await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
    }
};

