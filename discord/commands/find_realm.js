const { SlashCommandBuilder, EmbedBuilder, WebhookClient, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { Authflow } = require('prismarine-auth');
const { RealmAPI } = require('prismarine-realms');
const { cat1, error, loading, replystart, replyend } = require('../../data/emojie');
const { discordInvite, discordlink, footer } = require('../../data/config');
const { checkAndSaveRealm } = require('../functions/realms.js')
const configFilePath = path.join(__dirname, '..', '..', 'data', 'config.json');


const databasePath = path.join(__dirname, '..', '..', 'data', 'database.json');
const userIdentifier = undefined;

module.exports = {
    command: new SlashCommandBuilder()
        .setName('findrealm')
        .setDescription("Find a Realm by name in the database or realm list.")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name associated with the Realm Code')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('source')
                .setDescription('Choose the source to search: database, realmlist, or both.')
                .setRequired(true)
                .addChoices(
                    { name: 'Database', value: 'database' },
                    { name: 'Realm List', value: 'realmlist' },
                    { name: 'Both', value: 'both' }
                )),
    execute: async (interaction) => {
        const name = interaction.options.getString('name').trim().toLowerCase();
        const source = interaction.options.getString('source');
        const userId = interaction.user.id;

        await interaction.deferReply({ ephemeral: false });


        const searchResults = [];

        if (source === 'database' || source === 'both') {
            try {
                const rawData = await fs.readFile(databasePath, 'utf-8');
                const database = JSON.parse(rawData);

                const foundItems = database.realms.filter(item => item.realmName && item.realmName.toLowerCase().includes(name));
                if (foundItems.length > 0) {
                    searchResults.push(...foundItems.map(item => ({
                        Name: item.realmName,
                        'Realm Code': item.realmCode,
                        'Realm ID': item.realmId,
                        Source: 'Database'
                    })));
                }
            } catch (error) {
                console.error('Error reading the database:', error);
            }
        }

        // Realmlist search logic
        if (source === 'realmlist' || source === 'both') {
            try {
                const authFlow = new Authflow(userIdentifier, `./authCache/${userId}`);
                const realmsList = await listRealms(authFlow);
                const filteredRealms = realmsList.filter(realm => realm.name.toLowerCase().includes(name.toLowerCase()));

                const databaseData = await fs.readFile(databasePath, 'utf-8');
                const database = JSON.parse(databaseData);

                if (filteredRealms.length > 0) {
                    searchResults.push(...filteredRealms.map(realm => {
                        const dbEntry = database.realms.find(item => item.realmId === realm.id);
                        return {
                            Name: realm.name,
                            'Realm Code': dbEntry ? dbEntry.realmCode : 'N/A',
                            'Realm ID': realm.id,
                            Source: 'Realm List'
                        };
                    }));
                }
            } catch (error) {
                console.error('Error fetching the realm list:', error);
            }
        }

        // If no results found
        if (searchResults.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#ffcc00')
                .setTitle('No Results Found')
                .setDescription(`${error} No realm codes found containing '${name}' in the ${source} ${error}`);
            try {
                await interaction.editReply({ embeds: [embed], ephemeral: true });
            } catch (error) {
                console.error('Error sending no results message:', error);
            }
        } else {
            const pageSize = 3;
            let currentPage = 0;

            const generateEmbed = (page) => {
                const start = page * pageSize;
                const end = start + pageSize;
                const pageResults = searchResults.slice(start, end);

                const formattedResults = pageResults.map((item, index) => ({
                    name: `${start + index + 1}. Name: ${item.Name}`,
                    value: `${item.Source === 'Database' ? (item['Realm Code'] !== 'N/A' ? accseptEmoji : errorEmoji) : ''} ${reply1} **Realm Code**: ${item['Realm Code']}\n ${reply1}**Realm ID**: ${item['Realm ID']}\n${reply2}**Source**: ${item.Source}`,
                    inline: false
                }));

                return new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle(`Realm Search Results (Page ${page + 1}/${Math.ceil(searchResults.length / pageSize)})`)
                    .addFields(formattedResults)
                    .setFooter({ text: `Number of search results found: ${searchResults.length}` });
            };

            const embedMessage = await interaction.editReply({
                embeds: [generateEmbed(currentPage)],
                components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(searchResults.length <= pageSize)
                )]
            });

            const collector = embedMessage.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                time: 60000
            });

            collector.on('collect', async i => {
                if (i.customId === 'previous') {
                    currentPage--;
                } else if (i.customId === 'next') {
                    currentPage++;
                }

                try {
                    await i.update({
                        embeds: [generateEmbed(currentPage)],
                        components: [new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('previous')
                                .setLabel('Previous')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(currentPage === 0),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setLabel('Next')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(currentPage === Math.ceil(searchResults.length / pageSize) - 1)
                        )]
                    });
                } catch (error) {
                    console.error('Error updating embed message:', error);
                }
            });

            collector.on('end', async () => {
                try {
                    await embedMessage.edit({ components: [] });
                } catch (error) {
                    console.error('Error clearing buttons after collector end:', error);
                }
            });
        }


    }
};
