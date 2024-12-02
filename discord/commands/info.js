const discord = require("discord.js");
const { ButtonBuilder, ActionRowBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { cat1, error, loading, replystart, replyend } = require('../../data/emojie');
const { discordInvite, discordlink, footer } = require('../../data/config');
module.exports = {
    /** @param {discord.ChatInputCommandInteraction} interaction */
    permission: (interaction) => true,

    command: new SlashCommandBuilder()
        .setName("info") 
        .setDescription("Gets Infos about the bot.")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setDMPermission(true),

    /** @param {discord.ChatInputCommandInteraction} interaction */
    execute: async (interaction) => {
        const embed = new EmbedBuilder()
            .setTitle("Bot Info")
            .addFields(
                { name: "Creator", value: "[TSL](https://discord.com/users/1150858705823334431), [obaqz](https://discord.com/users/1279212131165667450),", inline: true },
                { name: "Developers", value: "[raks](https://discord.com/users/1250041939529568297), [Dusty](https://discord.com/users/837826878223548436)", inline: true },
                { name: "Contributors", value: "", inline: false }
            )
            .setFooter({
                text: `${interaction.user.username} | discord.gg/frosted`,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

        const supportButton = new ButtonBuilder()
            .setLabel("Support Server")
            .setStyle(discord.ButtonStyle.Link)
            .setURL(discordlink);

        const row = new ActionRowBuilder().addComponents(supportButton);

        return interaction.reply({
            embeds: [embed],
            components: [row] 
        });
    },
};
