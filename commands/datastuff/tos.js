const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { Authflow, Titles } = require("prismarine-auth");
const crypto = require("node:crypto");
const fs = require("node:fs");
const axios = require("axios");
const axl = require("app-xbox-live");
const config = require('../../data/discord/config.json')
const curve = "secp384r1";
const colors = require('../../data/handles/colors.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName("tos")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setDescription("Agree to the tos and start using commands."),
    execute: async (interaction) => {
        interaction.client.on('error', console.error);
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Frosted Tos")
                    .setDescription(`Loading auth data to start auth.\n\nChecking data we have already to find out if you have accepted tos already.`)
                    .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                    .setThumbnail(config.embeds.footerurl)
                    .setColor(config.embeds.color)
            ],
            ephemeral: true, //as this is true you wont need to do this again in editreply (thanks discord)
            components: []
        });

        if (fs.existsSync('./data/client/users.json')) {
            let data = JSON.parse(fs.readFileSync('./data/client/users.json', 'utf8'));
        
            if (data[interaction.user.id].tos) {



                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Frosted Tos")
                            .setDescription(`You have already accepted tos, do /link to get started!`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: interaction.user.displayAvatarURL() })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color),
                    ],
                    ephemeral: true
                });

                return;
            } else {
            const tosbuttton = new ButtonBuilder()
                .setCustomId('yes')
                .setLabel('Agree to tos')
                .setStyle(ButtonStyle.Danger);
    
            const row = new ActionRowBuilder().addComponents(tosbuttton);

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Frosted Tos")
                            .setDescription(`By accepting tos you agree that anything you use with frosted eg. spam that you take all action and responsibility for, frosted and its devs do not take any responsibility for what you do.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                            .setThumbnail(config.embeds.footerurl)
                            .setColor(config.embeds.color)
                    ],
                    ephemeral: true,
                    components: [row]
                });
                interaction.client.on('interactionCreate', async (buttonInteraction) => {
                    if (!buttonInteraction.isButton()) return;
                    if (buttonInteraction.customId !== 'yes') return;
                    if (buttonInteraction.user.id !== interaction.user.id) {
                        return await buttonInteraction.reply({ content: "You cannot use this button.", ephemeral: true }); //shouldnt happen but jst in case
                    }
        
        
                    data[interaction.user.id].tos = true;
        
                    fs.writeFileSync('./data/client/users.json', JSON.stringify(data, null, 2));
        
                    await buttonInteraction.update({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("Frosted Tos")
                                .setDescription("You have agreed to tos and can now start using frosted.")
                                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                                .setThumbnail(config.embeds.footerurl)
                                .setColor(config.embeds.color)
                        ],
                        components: [],
                    });
                });
            }
        }
    },
};