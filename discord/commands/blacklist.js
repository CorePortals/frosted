const { SlashCommandBuilder, EmbedBuilder, WebhookClient } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const blacklistPath = path.join(__dirname, '..', '..', 'data', 'blacklist.json');
const adminFilePath = path.join(__dirname, '..', '..', 'data', 'admin.json');
const { join_leave_weebhook } = path.join(__dirname, '..', '..', 'data', 'config.js');

let webhookClient = join_leave_weebhook;
let adminUsers = new Set();
let blacklistedUsers = new Set();

async function loadAdminAndBlacklist() {
    try {
        const adminData = await fs.readFile(adminFilePath, 'utf-8');
        adminUsers = new Set(JSON.parse(adminData));

        const blacklistData = await fs.readFile(blacklistPath, 'utf-8');
        blacklistedUsers = new Set(JSON.parse(blacklistData));
    } catch (error) {
        console.error('Failed to load admin or blacklist file', error);
    }
}

loadAdminAndBlacklist();

module.exports = {
    command: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Manage the user blacklist for bot commands.')
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Add a user to the blacklist.')
                .addUserOption(option => option.setName('user').setDescription('The user to blacklist').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('Remove a user from the blacklist.')
                .addUserOption(option => option.setName('user').setDescription('The user to remove from blacklist').setRequired(true))),

    execute: async (interaction) => {
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');

        if (!adminUsers.has(interaction.user.id)) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription('You do not have permission to use this command.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        switch (subcommand) {
            case 'add':
                if (blacklistedUsers.has(user.id)) {
                    const embedExists = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('Error')
                        .setDescription(`${user.tag} is already blacklisted.`);
                    return interaction.reply({ embeds: [embedExists], ephemeral: true });
                }

                blacklistedUsers.add(user.id);
                await updateBlacklistFile();

                const embedAdded = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('Success')
                    .setDescription(`${user.tag} has been added to the blacklist.`);
                await interaction.reply({ embeds: [embedAdded], ephemeral: false });

                if (webhookClient) {
                    const webhookEmbedAdd = new EmbedBuilder()
                        .setTitle('User Blacklisted')
                        .setDescription(`**User**: ${user.tag} (${user.id})\n**Added by**: ${interaction.user.tag} (${interaction.user.id})`)
                        .setColor(0xFF0000);
                    await webhookClient.send({ embeds: [webhookEmbedAdd] }).catch(console.error);
                }
                break;

            case 'remove':
                if (!blacklistedUsers.has(user.id)) {
                    const embedNotExists = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('Error')
                        .setDescription(`${user.tag} is not blacklisted.`);
                    return interaction.reply({ embeds: [embedNotExists], ephemeral: true });
                }

                blacklistedUsers.delete(user.id);
                await updateBlacklistFile();

                const embedRemoved = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('Success')
                    .setDescription(`${user.tag} has been removed from the blacklist.`);
                await interaction.reply({ embeds: [embedRemoved], ephemeral: false });

                if (webhookClient) {
                    const webhookEmbedRemove = new EmbedBuilder()
                        .setTitle('User Removed from Blacklist')
                        .setDescription(`**User**: ${user.tag} (${user.id})\n**Removed by**: ${interaction.user.tag} (${interaction.user.id})`)
                        .setColor(0x00FF00);
                    await webhookClient.send({ embeds: [webhookEmbedRemove] }).catch(console.error);
                }
                break;
        }
    }
};

async function updateBlacklistFile() {
    try {
        await fs.writeFile(blacklistPath, JSON.stringify([...blacklistedUsers]), 'utf-8');
        console.log('Blacklist updated:', [...blacklistedUsers]);
    } catch (error) {
        console.error('Error updating the blacklist file:', error);
    }
}
