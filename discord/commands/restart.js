const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const adminFilePath = path.join(__dirname, '..', '..', 'data', 'admin.json');

let adminUsers = new Set();

async function loadAdminUsers() {
    try {
        const adminData = await fs.readFile(adminFilePath, 'utf-8');
        adminUsers = new Set(JSON.parse(adminData));
        console.log('Admin users successfully loaded.');
    } catch (error) {
        console.error('Failed to load admin file:', error);
    }
}

loadAdminUsers();

module.exports = {
    command: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Restart the server. (Admins only)'),

    execute: async (interaction) => {
        // Ensure the admin data is loaded before continuing
        await loadAdminUsers();

        if (!adminUsers.has(interaction.user.id)) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription('You do not have permission to use this command.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const embedRestarting = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Restarting Server')
            .setDescription('The server is restarting. Please wait...');
        await interaction.reply({ embeds: [embedRestarting], ephemeral: false });

        // Exit the process to restart the server
        console.log('Server is restarting...');
        process.exit(1); // This will terminate the process and restart the server
    }
};
