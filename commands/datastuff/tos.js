const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("node:fs");
const config = require('../../data/discord/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("tos")
        .setDescription("Agree to the TOS and start using commands."),
    execute: async (interaction) => {
        interaction.client.on('error', console.error);

        // Initial response
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Frosted TOS")
                    .setDescription("Checking if you have already accepted the TOS...")
                    .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                    .setThumbnail(config.embeds.footerurl)
                    .setColor(config.embeds.color),
            ],
            ephemeral: true,
        });

        // Load user data
        let data = {};
        if (fs.existsSync('./data/client/users.json')) {
            data = JSON.parse(fs.readFileSync('./data/client/users.json', 'utf8'));
        }

        // Check if TOS is already accepted
        if (data[interaction.user.id]?.tos) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Frosted TOS")
                        .setDescription("You have already accepted the TOS. Use `/link` to get started!")
                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: interaction.user.displayAvatarURL() })
                        .setThumbnail(config.embeds.footerurl)
                        .setColor(config.embeds.color),
                ],
                ephemeral: true,
            });
            return;
        }

        // Create Agree Button
        const tosButton = new ButtonBuilder()
            .setCustomId('agree_tos')
            .setLabel('Agree to TOS')
            .setStyle(ButtonStyle.Success);

        const buttonRow = new ActionRowBuilder().addComponents(tosButton);

        // Prompt user to accept TOS
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Frosted TOS")
                    .setDescription(
                        "By agreeing, you accept all responsibility for using Frosted, including spam or other actions. Frosted and its developers are not liable for your actions."
                    )
                    .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                    .setThumbnail(config.embeds.footerurl)
                    .setColor(config.embeds.color),
            ],
            components: [buttonRow],
            ephemeral: true,
        });

        // Handle button interactions
        const filter = (btnInteraction) =>
            btnInteraction.customId === 'agree_tos' && btnInteraction.user.id === interaction.user.id;

        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (btnInteraction) => {
            data[interaction.user.id] = { ...data[interaction.user.id], tos: true };

            // Save user data
            fs.writeFileSync('./data/client/users.json', JSON.stringify(data, null, 2));

            await btnInteraction.update({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Frosted TOS")
                        .setDescription("You have agreed to the TOS and can now start using Frosted.")
                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                        .setThumbnail(config.embeds.footerurl)
                        .setColor(config.embeds.color),
                ],
                components: [],
            });
        });

        collector.on('end', async (collected) => {
            if (!collected.size) {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Frosted TOS")
                            .setDescription("You did not respond in time. Please use `/tos` again.")
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color),
                    ],
                    components: [],
                });
            }
        });
    },
};
