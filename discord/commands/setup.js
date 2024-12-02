const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, WebhookClient } = require('discord.js');
const fsPromises = require('fs').promises;
const path = require('path');

const usersPath = path.join(__dirname, '..', '..', 'data', 'users.json');
const blacklistPath = path.join(__dirname, '..', '..', 'data', 'blacklist.json');
const tosPath = path.join(__dirname, '..', '..', 'data', 'tos.txt');
const {newusers}  = require('../../data/config')



newuserweebhook = new WebhookClient({ url: newusers });



const MAX_MESSAGE_LENGTH = 2000;

module.exports = {
    command: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Shows the Terms of Service (TOS) setup with buttons')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2),

    execute: async (interaction) => {
        // Check if the interaction is in a DM bc Buttons have a Problem whit DMS
        if (!interaction.guild) {
            await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
            return; 
        }

        if (interaction.replied || interaction.deferred) {
            return;
        }

        const acceptButton = new ButtonBuilder()
            .setCustomId('accept_tos')
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success);

        const showTosButton = new ButtonBuilder()
            .setCustomId('show_tos')
            .setLabel('Show TOS')
            .setStyle(ButtonStyle.Primary);

        const disagreeButton = new ButtonBuilder()
            .setCustomId('disagree_tos')
            .setLabel('Disagree')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(acceptButton, showTosButton, disagreeButton);

        try {
            await interaction.reply({
                content: 'Please review and accept the Terms of Service (TOS) to continue.',
                components: [row]
            });
        } catch (err) {
            console.error('[ERROR] Error sending initial reply:', err);
            return;
        }

        const filter = i => i.customId === 'accept_tos' || i.customId === 'show_tos' || i.customId === 'disagree_tos';
        const collector = interaction.channel.createMessageComponentCollector({ filter });

        collector.on('collect', async i => handleCollect(i));
        collector.on('end', collected => handleEnd(interaction, collected));

        async function handleCollect(i) {
            if (i.customId === 'accept_tos') {
                const userData = {
                    userid: i.user.id,
                    username: i.user.username,
                    whitelistedrealms: 0,
                    premium: false,
                    premiumplus: false,
                    premiummonths: 0,
                    cangift: false,
                    commandscount: 0,
                    haslinked: false,
                    date: new Date().toISOString(),
                    honeypotflagged: 0,
                    coins: 0,
                    databasenukes: 0,
                    whitelists: 0,
                    admin: false,
                    hadTrial: false,
                    language: 'eng',
                    lastDailyClaim: new Date().toISOString(),
                };

                try {
                    const data = await fsPromises.readFile(usersPath, 'utf-8');
                    const users = JSON.parse(data.trim());
                    users.push(userData);

                    await fsPromises.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf-8');
                    if (!i.replied && !i.deferred) {
                        // Set ephemeral to true
                        await i.update({ content: 'Thank you for accepting the TOS!', components: [], ephemeral: true });

                        const embed = new EmbedBuilder()
                            .setColor('#00ff00')
                            .setTitle('New User Accepted TOS')
                            .addFields(
                                { name: 'Username', value: i.user.username, inline: true },
                                { name: 'User ID', value: i.user.id, inline: true },
                                { name: 'Time', value: new Date().toISOString(), inline: true },
                                { name: 'Server', value: interaction.guild.name, inline: true }
                            )
                            .setThumbnail(i.user.displayAvatarURL())
                            .setTimestamp();

                        newuserweebhook.send({
                            username: 'TOS Bot',
                            avatarURL: 'https://cdn.discordapp.com/attachments/1278315418817265675/1310706960554786940/Q21GLvWzBn4G.png?ex=6746327b&is=6744e0fb&hm=48ceeb5e288f5461b7a71070432fe242b7338524b95571ee8f00c3ae44ef6464&',
                            embeds: [embed],
                        });
                    }
                } catch (err) {
                    console.error('[ERROR] Error processing accept button:', err);
                    if (!i.replied && !i.deferred) {
                        await i.update({ content: 'An error occurred while saving your data.', components: [], ephemeral: true });
                    }
                }
            } else if (i.customId === 'show_tos') {
                try {
                    const tosContent = await fsPromises.readFile(tosPath, 'utf-8');
                    const chunks = tosContent.match(/.{1,2000}/g);

                    for (const chunk of chunks) {
                        if (!i.replied && !i.deferred) {
                            await i.reply({ content: chunk, ephemeral: true });
                        }
                    }
                } catch (err) {
                    console.error('[ERROR] Error reading TOS file:', err);
                    if (!i.replied && !i.deferred) {
                        await i.reply({ content: 'An error occurred while fetching the Terms of Service.', ephemeral: true });
                    }
                }
            } else if (i.customId === 'disagree_tos') {
                try {
                    const data = await fsPromises.readFile(blacklistPath, 'utf-8');
                    const blacklist = JSON.parse(data.trim());

                    if (!blacklist.includes(i.user.id)) {
                        blacklist.push(i.user.id);
                        await fsPromises.writeFile(blacklistPath, JSON.stringify(blacklist, null, 2), 'utf-8');
                    }

                    if (!i.replied && !i.deferred) {
                        await i.update({ content: 'You have been added to the blacklist because you did not accept the TOS.', components: [], ephemeral: true });
                    }
                } catch (err) {
                    console.error('[ERROR] Error processing disagree button:', err);
                    if (!i.replied && !i.deferred) {
                        await i.update({ content: 'An error occurred while processing your request.', components: [], ephemeral: true });
                    }
                }
            }
        }

        function handleEnd(interaction, collected) {
            if (collected.size === 0) {
                if (!interaction.replied && !interaction.deferred) {
                    interaction.editReply({ components: [] });
                }
            }
        }
    }
};
