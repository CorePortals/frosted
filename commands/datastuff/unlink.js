const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const usersFilePath = "./data/client/users.json";
const profilesPath = path.join(__dirname, "..", "..", "data", "client", "frosted");
const config = require('../../data/discord/config.json');
const colors = require('../../data/handles/colors.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unlink")
        .setDescription("Delete all personal data stored by frosted.")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2),
    
    async execute(interaction) {
        const userId = interaction.user.id;
        let data = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));

        if (!data[userId] || !data[userId].xbox) {
            return interaction.reply('You have no linked Xbox profiles.');
        }

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('unlink_account')
                .setPlaceholder('Select an account to unlink')
                .addOptions([
                    { label: 'Account 1', description: 'Unlink Xbox Account 1', value: '1' },
                    { label: 'Account 2', description: 'Unlink Xbox Account 2', value: '2' },
                    { label: 'Account 3', description: 'Unlink Xbox Account 3', value: '3' },
                    { label: 'All Accounts', description: 'Unlink all Xbox accounts', value: 'all' }
                ])
        );

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Frosted Unlink")
                    .setDescription("Select the account you want to unlink.")
                    .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                    .setThumbnail(config.embeds.footerurl)
                    .setColor(config.embeds.color)
            ],
            components: [row]
        });

        interaction.client.on('interactionCreate', async (selectInteraction) => {
            if (!selectInteraction.isSelectMenu()) return;
            if (selectInteraction.customId !== 'unlink_account') return;
            if (selectInteraction.user.id !== interaction.user.id) {
                return await selectInteraction.reply({ content: "You cannot use this menu.", ephemeral: true });
            }

            const selectedAccount = selectInteraction.values[0];

            if (selectedAccount === 'all') {
                for (let j = 1; j <= 3; j++) {
                    const accountKey = `xbox${j}`;
                    if (data[userId].xbox[accountKey]) {
                        data[userId].xbox[accountKey] = { linked: false };
                    }
                    const profileFolderPath = path.join(profilesPath, `${userId}`, `xbox${j}`);
                    if (fs.existsSync(profileFolderPath)) {
                        fs.rmSync(profileFolderPath, { recursive: true, force: true });
                    }
                }
                await selectInteraction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Unlinked Account")
                            .setDescription(`All Xbox accounts have been unlinked and profile data removed successfully.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ],
                    components: []
                });
            } else {
                const accountKey = `xbox${selectedAccount}`;
                if (!data[userId].xbox[accountKey] || !data[userId].xbox[accountKey].linked) {
                    return await selectInteraction.update({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Frosted Error")
                                .setDescription(`Account ${selectedAccount} is not linked.`)
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ],
                        components: []
                    });
                }

                data[userId].xbox[accountKey] = { linked: false };
                const profileFolderPath = path.join(profilesPath, `${userId}`, `profile${selectedAccount}`);
                if (fs.existsSync(profileFolderPath)) {
                    fs.rmSync(profileFolderPath, { recursive: true, force: true });
                }

                await selectInteraction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Unlinked Account")
                            .setDescription(`Account ${selectedAccount} has been unlinked and profile data removed successfully.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ],
                    components: []
                });
            }

            fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 4));
        });
    }
};

