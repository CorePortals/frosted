const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const bedrock = require('bedrock-protocol');
const { checkAndSaveRealm } = require('../functions/realms.js')
const usersPath = path.join(__dirname, '..', '..', 'data', 'users.json');
const { NIL, v3: uuidv3, v4: uuidv4 } = require('uuid');
const { cat1, error, loading, replystart, replyend } = require('../../data/emojie');
const { discordInvite, discordlink, footer, waterwark } = require('../../data/config');

module.exports = {
  command: new SlashCommandBuilder()
    .setName('seed')
    .setDescription('Find the seed of the realm.')
    .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
    .addStringOption(option =>
      option.setName('code')
        .setDescription('The realm code to join')
        .setRequired(true)
    ),
  execute: async (interaction) => {
    const userId = interaction.user.id;
    const realmCode = interaction.options.getString('code');
    const profilesFolder = `./authCache/${interaction.user.id}`;
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
      const userData = usersData.find(user => user.userid === userId);

      if (userData && !userData.haslinked) {
        const errorEmbed = {
            title: "Error",
            description: "No linked account found. Please link an account to use the Linked Account Option.",
            color: 0xff0000,
        };
        return interaction.reply({ embeds: [errorEmbed] });
    }
    

    const embed = new EmbedBuilder()
      .setTitle(`${cat1} Seed ${cat1}`)
      .setDescription(`${replystart}Joining realm\n${replyend}Finding seed`)
      .setFooter({
        text: `${interaction.user.username} | ${discordInvite}`,
        iconURL: interaction.user.displayAvatarURL(),
    })

    const message = await interaction.reply({ embeds: [embed], fetchReply: true });

    try {
        const client = bedrock.createClient({
            profilesFolder,
            offline: false,
            skinData: {
                CurrentInputMode: 3,
                DefaultInputMode: 3,
                DeviceOS: 11,
                DeviceId: uuidv3(uuidv4(), NIL),
                PlatformOnlineId: generateRandomString(19, '1234567890'),
                PrimaryUser: false,
                SelfSignedId: uuidv4(),
                TrustedSkin: true,
            },
            skipPing: true,
            realms: {
                [realmCode.length === 8 ? "realmId" : "realmInvite"]: realmCode.length === 8 ? realmCode : `${realmCode}`,
            },
        });

        client.on('start_game', async (packet) => {
        checkAndSaveRealm(realmCode, userId)
        const seed = packet.seed;
        client.disconnect();

        embed.setDescription(`${replystart}Grabbed Seed\n${replystart}Seed: ${seed}\n${replyend}[Chunkbase](https://www.chunkbase.com/apps/seed-map#${seed})`);
        await message.edit({
          embeds: [embed]
        });
      });

      client.on('kick', async (reason) => {
        embed.setColor(16729871)
          .setDescription(`Error: ${parseKickMessage(reason.message)}`);
        await message.edit({ embeds: [embed] });
      });

      client.on('error', async (error) => {
        embed.setColor(16729871)
          .setDescription(`Error: ${error.message}`);
        await message.edit({ embeds: [embed] });
      });

    } catch (error) {
      embed.setColor(16729871)
        .setDescription(`Error: ${error.message}`);
      await message.edit({ embeds: [embed] });
    }
  }
};

function generateRandomString(length, charSet) {
    if (!charSet) charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890_-';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += charSet.charAt(Math.floor(Math.random() * charSet.length));
    }
    return result;
}
