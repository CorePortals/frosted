const { ChannelType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../data/discord/config.json');

const arasrpath = path.join(__dirname, '..', 'data', 'discord', 'arasr.json');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {

    if (!fs.existsSync(arasrpath)) {
      console.error('[error] arasr database not found');
      return;
    }

    const arasrusers = JSON.parse(fs.readFileSync(arasrpath, 'utf-8'));
    if (arasrusers.users.some(user => user.id === member.user.id)) {

        const guilds = path.join(__dirname, '..', 'data', 'handles', 'guilds.json');
        let guildData;

        if (fs.existsSync(guilds)) {
            guildData = JSON.parse(fs.readFileSync(guilds, 'utf8'));
          } else {
            console.log("[error] guilds not found");
            return;
          }
      
          const guildInfo = guildData.find(g => g.guildId === member.guild.id);
          if (!guildInfo) {
            console.log("[error] guild info not found");
            return;
          }


          const logchannel = member.client.channels.cache.get(config.logging.arasralt);
 
          if (logchannel && logchannel.type === ChannelType.GuildText) {
            const embed = new EmbedBuilder()
              .setTitle('Arasr alt detected')
              .setColor(config.embeds.color)
              .setFooter({ text: config.embeds.footer, iconURL: config.embeds.footerurl })
              .setDescription(`<@${member.user.id}> has joined **${member.guild.name}** (${member.guild.id}) and was found in the ARASR database.`)
              .addFields(
                { name: 'User id', value: member.user.id ?? "unknown id", inline: true },
                { name: 'User name', value: member.user.name ?? "unknown name", inline: true },
                { name: 'User tag', value: member.user.tag ?? "unknown tag", inline: true },
      
                { name: 'Guild id', value: member.guild.id ?? "unknown id", inline: true },
                { name: 'Guild name', value: member.guild.name ?? "unknown name", inline: true },
                { name: 'Guild Invite', value: guildInfo.inviteLink ?? "unknown invite", inline: true }
              );
      
            logchannel.send({ embeds: [embed] });
          } else {
            console.log("[error] log channel not found");
          }


      try {
        console.log(`[warning] ${member.user.tag} (${member.user.id}) joined ${member.guild.name} (${member.guild.id})`);
      } catch (error) {
        //what will go wrong in warning LMAO
      }
    }
  }
};
