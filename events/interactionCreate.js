const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const config = require('../data/discord/config.json');
const osUtils = require('os-utils');
const os = require('os');
const cooldowns = {};

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        const now = new Date();

        const accountsPath = path.resolve(__dirname, '../data/client/users.json');
        const accountinfo = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
        const user = interaction.user.id;

        if (accountinfo[user] && accountinfo[user].blacklisted) {
            return interaction.reply({ content: `You are blacklisted from using commands.`, ephemeral: true });
        }

        if (!accountinfo[user]) {
            accountinfo[user] = {
                
            };
            fs.writeFileSync(accountsPath, JSON.stringify(accountinfo, null, 2), 'utf8');
        }

        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            const cooldownkey = `${user}-${interaction.commandName}`;
            const cooldowntime = 60000;

            if (!cooldowns[cooldownkey]) {
                cooldowns[cooldownkey] = 0;
            }

            const lastcmdtime = now - cooldowns[cooldownkey];

            if (lastcmdtime < cooldowntime) {
                const timeleft = ((cooldowntime - lastcmdtime) / 1000).toFixed(1);
                return interaction.reply({
                    content: `You need to wait ${timeleft} more seconds before using \`${interaction.commandName}\` again.`,
                    ephemeral: true
                });
            }

            if (!accountinfo[user].commands) {
                accountinfo[user].commands = [];
            }
            accountinfo[user].commands.push({
                timestamp: Date.now(),
                commandName: interaction.commandName,
                guildId: interaction.guildId,
                channelId: interaction.channelId
            });

            cooldowns[cooldownkey] = now;
            fs.writeFileSync(accountsPath, JSON.stringify(accountinfo, null, 2), 'utf8');

            try {
                await command.execute(interaction, accountinfo);

                const logchannel = interaction.client.channels.cache.get(config.logging.commandused);
                if (logchannel && logchannel.type === ChannelType.GuildText) {
                    const options = interaction.options.data.map(option => {
                        return { name: option.name, value: `${option.value || 'None'}`, inline: true };
                    });
                
                    const guildName = interaction.guild ? interaction.guild.name : "DM";
                    const guildId = interaction.guildId || "DM";
                    const userId = interaction.user.id;
                
                    // Get system RAM and CPU usage
                    const totalMemory = os.totalmem() / (1024 * 1024); // Convert to MB
                    const freeMemory = os.freemem() / (1024 * 1024); // Convert to MB
                    const usedMemory = totalMemory - freeMemory;
                    const cpuUsage = await new Promise((resolve) => osUtils.cpuUsage(resolve));
                
                    // Create the embed
                    const embed = new EmbedBuilder()
                    .setColor(config.embeds.color)
                    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                    .setTitle("Command Used")
                    .addFields(
                        { name: "Command", value: `/${interaction.commandName} ${interaction.options._hoistedOptions.map((opt) => `**${opt.name}**: "${opt.value}"`).join(", ") || "No options"}` },
                        { name: "Guild", value: guildName || "DM", inline: true },
                        { name: "Channel", value: `<#${interaction.channelId}>`, inline: true },
                        { name: "By", value: `${interaction.user.tag} (${interaction.user.id})` },
                        { name: "RAM Usage", value: `${usedMemory.toFixed(2)}MB / ${totalMemory.toFixed(2)}MB`, inline: true },
                        { name: "CPU Usage", value: `${(cpuUsage * 100).toFixed(2)}%`, inline: true }
                    )
                    .setFooter({ text: config.embeds.footer, iconURL: config.embeds.footerurl })
                    .setTimestamp();

                    logchannel.send({ embeds: [embed] });
                } else {
                    console.error('Log channel not found or not a text channel.');
                }
                
            } catch (error) {
                try {
                    console.log(error.message)
                    if (error instanceof DiscordAPIError) {
                        console.error( console.red +"[ERROR]"  + console.white + " Discord API Error:", error.message);
                        
                        if (interaction) {
                            return interaction.reply({
                                content: `:x: Discord API Error: ${error.message}`,
                                ephemeral: true
                            }).catch(err => {
                                console.error(console.red +"[ERROR]" + console.white +"Failed to send error reply to interaction:", err.message);
                            });
                        }
                    } else if (error instanceof HTTPError) {
                        console.error(console.red +"[ERROR] HTTP Error:", error.message);
                        
                        if (interaction) {
                            return interaction.reply({
                                content: `:x: HTTP Error: ${error.message}`,
                                ephemeral: true
                            }).catch(err => {
                                console.error(console.red +"[ERROR]>>>>" + console.white + " Failed to send HTTP error reply:", err.message);
                            });
                        }
                    } else {
                        console.error(console.red +"[ERROR]>>>>" + console.white + " Unknown Error:", error.message);
                
                        if (interaction) {
                            return interaction.reply({
                                content: `:x: An unknown error occurred. Please try again later.`,
                                ephemeral: true
                            }).catch(err => {
                                console.error(console.red +"[ERROR]>>>>"+ console.white+ " Failed to send unknown error reply:", err.message);
                            });
                        }
                    }
            } catch (error) {
                // need to do handling for invalid message type shit
            }
            }
        }
    },
};
