const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, WebhookClient } = require('discord.js');
const { RealmAPI } = require('prismarine-realms');
const { Authflow } = require('prismarine-auth');

const usersPath = path.join(__dirname, '..', '..', 'data', 'users.json');
const whitelistPath = path.join(__dirname, '..', '..', 'data', 'whitelist.json');
const realmsDatabasePath = path.join(__dirname, '..', '..', 'data', 'database.json'); 



let usersData = [];
let whitelistData = [];
let realmsData = []; 

async function loadData() {
    try {
        usersData = JSON.parse(await fs.promises.readFile(usersPath, 'utf-8'));
        whitelistData = JSON.parse(await fs.promises.readFile(whitelistPath, 'utf-8')).whitelist || [];
        realmsData = JSON.parse(await fs.promises.readFile(realmsDatabasePath, 'utf-8')).realms || [];
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

async function saveData() {
    try {
        await fs.promises.writeFile(usersPath, JSON.stringify(usersData, null, 2), 'utf-8');
        await fs.promises.writeFile(whitelistPath, JSON.stringify({ whitelist: whitelistData }, null, 2), 'utf-8');
        await fs.promises.writeFile(realmsDatabasePath, JSON.stringify({ realms: realmsData }, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

loadData();

module.exports = {
    command: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Manage the realm whitelist')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a realm to your whitelist using the realm code')
                .addStringOption(option =>
                    option.setName('code')
                        .setDescription('The realm code')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a realm from your whitelist and from the database')
                .addStringOption(option =>
                    option.setName('code')
                        .setDescription('The realm code to remove')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all realms in your whitelist')
        ),
    execute: async (interaction) => {
        try {
            const subcommand = interaction.options.getSubcommand();
            switch (subcommand) {
                case 'add':
                    await addRealm(interaction);
                    break;
                case 'remove':
                    await removeRealm(interaction);
                    break;
                case 'list':
                    await listRealms(interaction);
                    break;
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            await interaction.reply({ content: 'An error occurred while managing the whitelist.', ephemeral: true });
        }
    }
};

async function addRealm(interaction) {
    const code = interaction.options.getString('code');
    const userId = interaction.user.id;

    const user = usersData.find(u => u.userid === userId);

    if (!user || user.whitelists < 1) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Error')
            .setDescription('You do not have enough whitelist tokens to add a realm.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }

    try {
        const profilesFolder = `./authCache/${userId}`;
        const options = {
            authTitle: '00000000441cc96b',
            flow: 'live'
        };
        const userIdentifier = undefined;
        const authFlow = new Authflow(userIdentifier, profilesFolder, options);
        const realmApi = RealmAPI.from(authFlow, 'bedrock');
        const realm = await realmApi.getRealmFromInvite(code); 

        if (!realm) {
            await interaction.reply({ content: 'Invalid realm code.', ephemeral: true });
            return;
        }

        const databaseRealmIndex = realmsData.findIndex(r => r.realmCode === code);
        if (databaseRealmIndex !== -1) {
            realmsData.splice(databaseRealmIndex, 1); 
        }

        whitelistData.push({
            name: realm.name,
            code: code,
            id: realm.id,
            owner: userId
        });

        user.whitelists -= 1;
        await saveData();

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('Realm Added')
            .setDescription(`Realm ${realm.name} has been added to your whitelist.`);
        await interaction.reply({ embeds: [embed], ephemeral: false });

    } catch (error) {
        console.error('Error adding realm:', error);
        await interaction.reply({ content: 'Failed to add realm.', ephemeral: true });
    }
}

async function removeRealm(interaction) {
    const code = interaction.options.getString('code');
    const userId = interaction.user.id;

    const realmIndex = whitelistData.findIndex(realm => realm.code === code);

    if (realmIndex === -1) {
        await interaction.reply({ content: 'Realm not found in your whitelist.', ephemeral: true });
        return;
    }

    const realm = whitelistData[realmIndex];

    if (realm.owner !== userId) {
        await interaction.reply({ content: 'You can only remove realms you added.', ephemeral: true });
        return;
    }

    whitelistData.splice(realmIndex, 1);

    const databaseRealmIndex = realmsData.findIndex(r => r.realmCode === code);
    if (databaseRealmIndex !== -1) {
        realmsData.splice(databaseRealmIndex, 1); 
        await saveData(); 
    }

    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Realm Removed')
        .setDescription(`Realm ${realm.name} has been removed from your whitelist and the database.`);
    await interaction.reply({ embeds: [embed], ephemeral: false });

}

async function listRealms(interaction) {
    const userId = interaction.user.id;
    const userRealms = whitelistData.filter(realm => realm.owner === userId);

    if (userRealms.length === 0) {
        await interaction.reply({ content: 'You have no realms in your whitelist.', ephemeral: true });
        return;
    }

    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Your Whitelisted Realms')
        .setDescription(userRealms.map(realm => `**Realm Name:** ${realm.name}\n**Realm Code:** ${realm.code}`).join('\n\n'));

    await interaction.reply({ embeds: [embed], ephemeral: false });
}
