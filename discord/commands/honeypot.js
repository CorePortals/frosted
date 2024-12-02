const { SlashCommandBuilder, EmbedBuilder, WebhookClient } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { Authflow } = require('prismarine-auth');
const { RealmAPI } = require('prismarine-realms');
const { cat1, error, loading, replystart, replyend } = require('../../data/emojie');
const { discordInvite, discordlink, footer } = require('../../data/config');
const { checkAndSaveRealm } = require('../functions/realms.js')
const adminFilePath = path.join(__dirname, '..', '..', 'data', 'admin.json');
const honeypotFilePath = path.join(__dirname, '..', '..', 'data', 'honeypot.json');

let adminUsers = new Set();

async function loadAdminUsers() {
    try {
        const adminData = await fs.readFile(adminFilePath, 'utf-8');
        adminUsers = new Set(JSON.parse(adminData));
    } catch (error) {
        console.error('Failed to load admin file', error);
    }
}

loadAdminUsers();

module.exports = {
    command: new SlashCommandBuilder()
        .setName('honeypot_manage')
        .setDescription("Manage Realm Codes in the honeypot database.")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Add a Realm Code to the honeypot database.')
                .addStringOption(option => 
                    option.setName('realmcode')
                        .setDescription('Realm Code to add')
                        .setRequired(true)
                        .setMinLength(11)))
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('Remove a Realm Code from the honeypot database.')
                .addStringOption(option =>
                    option.setName('realmcode')
                        .setDescription('Realm Code to remove')
                        .setRequired(true)
                        .setMinLength(11))),
    execute: async (interaction) => {
        const subcommand = interaction.options.getSubcommand();
        const realmCode = interaction.options.getString('realmcode');

        await interaction.deferReply({ ephemeral: false });

        if (!adminUsers.has(interaction.user.id)) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Cope')
                .setDescription(`${error} This Command is Staff only ${error}`);
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        switch (subcommand) {
            case 'add':
                await addRealmCode(realmCode, interaction);
                break;
            case 'remove':
                await removeRealmCode(realmCode, interaction);
                break;
        }
    }
};

async function addRealmCode(realmCode, interaction) {
    let honeypot = await readHoneypot();

    if (honeypot.includes(realmCode)) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Error')
            .setDescription(`${error} ${realmCode} is alrady a Honeypot ${error}`)
            .setFooter({
                text: `${interaction.user.username} | discord.gg/frosted`,
                iconURL: interaction.user.displayAvatarURL(),
            })
        await interaction.editReply({ embeds: [embed], ephemeral: true });
        return;
    }

    try {
        honeypot.push(realmCode);
        await saveHoneypot(honeypot);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('Success')
            .setDescription(`${cat1} ${realmCode} has been added as a Honeypot Realm and cant be joind anymore`)
            .setFooter({
                text: `${interaction.user.username} | discord.gg/frosted`,
                iconURL: interaction.user.displayAvatarURL(),
            })
        await interaction.editReply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error adding honeypot realm code:', error);
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Error')
            .setDescription(`${error} Failed to add ${realmCode} to the honeypot database.`)
            .setFooter({
                text: `${interaction.user.username} | discord.gg/frosted`,
                iconURL: interaction.user.displayAvatarURL(),
            })
        await interaction.editReply({ embeds: [embed], ephemeral: true });
    }
}

async function removeRealmCode(realmCode, interaction) {
    let honeypot = await readHoneypot();
    const index = honeypot.indexOf(realmCode);

    if (index === -1) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Error')
            .setDescription(`${errorEmoji} ${realmCode} is not a Honeypot ${errorEmoji}`)
            .setFooter({
                text: `${interaction.user.username} | discord.gg/frosted`,
                iconURL: interaction.user.displayAvatarURL(),
            })
        await interaction.editReply({ embeds: [embed], ephemeral: true });
        return;
    }

    honeypot.splice(index, 1);
    await saveHoneypot(honeypot);

    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Success')
        .setDescription(`${cat1} ${realmCode} has been removed from the honeypot database and can be joind again.`)
        .setFooter({
            text: `${interaction.user.username} | discord.gg/frosted`,
            iconURL: interaction.user.displayAvatarURL(),
        })
    await interaction.editReply({ embeds: [embed], ephemeral: true });
}

async function readHoneypot() {
    try {
        const data = await fs.readFile(honeypotFilePath, 'utf-8');
        return JSON.parse(data.trim());
    } catch (error) {
        console.error('Error reading honeypot file:', error);
        return [];
    }
}

async function saveHoneypot(honeypot) {
    try {
        await fs.writeFile(honeypotFilePath, JSON.stringify(honeypot, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving honeypot file:', error);
    }
}
