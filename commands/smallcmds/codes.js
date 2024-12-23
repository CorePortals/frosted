const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { Authflow: PrismarineAuth, Titles } = require('prismarine-auth');
const { RealmAPI } = require('prismarine-realms');


const databasePath = './data/client/database.json'
const whitelistPath = './data/client/whitelist.json'

module.exports = {
    data: new SlashCommandBuilder()
        .setName('codes')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setDescription('See how many Realm Codes we have in the Realmlist and Database.'),

        execute: async (interaction) => {
            const userId = interaction.user.id;
        
            try {
                await interaction.deferReply();
        
                const databaseData = await fs.readFile(databasePath, 'utf-8');
                const whitelistData = await fs.readFile(whitelistPath, 'utf-8');
        
                const database = databaseData.trim() ? JSON.parse(databaseData) : { realms: [] };
                const whitelist = whitelistData.trim() ? JSON.parse(whitelistData) : { whitelist: [] };
        
                const databaseCount = Array.isArray(database.realms) ? database.realms.length : 0;
                const whitelistCount = Array.isArray(whitelist.whitelist) ? whitelist.whitelist.length : 0;
        
                const authflow = await new PrismarineAuth(undefined, "./auth", { 
                    flow: "live", 
                    authTitle: Titles.MinecraftNintendoSwitch, 
                    deviceType: "Nintendo", 
                    doSisuAuth: true 
                });
                const api = RealmAPI.from(authflow, 'bedrock');
                const realmsList = await api.getRealms();
        
                if (!Array.isArray(realmsList)) {
                    throw new Error('Unexpected response from the Realm API.');
                }
        
                const realmCount = realmsList.length;
                const onlineRealms = realmsList.filter(realm => realm.state === 'OPEN').length;
                const offlineRealms = realmCount - onlineRealms;
        
                const embed = new EmbedBuilder()
                    .setTitle('Realms Count:')
                    .setDescription(`\n\nDatabase Codes: ${databaseCount}\nWhitelist Codes: ${whitelistCount}\nTotal Realms (API Acc): ${realmCount}\nOnline Realms: ${onlineRealms}\nOffline Realms: ${offlineRealms}`)
                    .setFooter({
                        text: `${interaction.user.username} | discord.gg/frosted`,
                        iconURL: interaction.user.displayAvatarURL(),
                    });
        
                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('Error responding to interaction:', error);
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Error')
                    .setDescription(`An error occurred while processing your request: ${error.message}`);
        
                await interaction.editReply({ embeds: [embed], ephemeral: true });
            }
        }
    }        

