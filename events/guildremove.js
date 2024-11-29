const { ChannelType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../data/discord/config.json');
module.exports = {
  name: 'guildDelete',
  async execute(guild) {
    const guildId = guild.id;

    const logchannel = guild.client.channels.cache.get(config.logging.guildremove);

    const guilds = path.join(__dirname, '..', 'data', 'handles', 'guilds.json');
    let guildData;

    if (fs.existsSync(guilds)) {
      guildData = JSON.parse(fs.readFileSync(guilds, 'utf8'));
    } else {
      return;
    }

    const guildInfo = guildData.find(g => g.guildId === guildId);
    if (!guildInfo) {
      return;
    }

    if (logchannel && logchannel.type === ChannelType.GuildText) {
      const embed = new EmbedBuilder()
        .setTitle('Left Server')
        .setColor(config.embeds.color)
        .setFooter({ text: config.embeds.footer, iconURL: config.embeds.footerurl })
        .addFields(
          { name: 'Server Name', value: guildInfo.guildName, inline: true },
          { name: 'Server ID', value: guildId, inline: true },
          { name: 'Member Count', value: `${guildInfo.memberCount}`, inline: true },
          { name: 'Owner', value: `${guildInfo.owner.tag}`, inline: true },
          { name: 'Owner ID', value: `${guildInfo.owner.id}`, inline: true },
          { name: 'Invite Link', value: guildInfo.inviteLink, inline: true }
        );

      logchannel.send({ embeds: [embed] });
    } else {
    }
  },
};
