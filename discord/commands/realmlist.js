const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Authflow } = require('prismarine-auth');
const { RealmAPI } = require('prismarine-realms');
const fs = require('node:fs');

module.exports = {
  command: new SlashCommandBuilder()
    .setName('listrealms')
    .setDescription('Lists all realms in your realm list with their IDs.')
    .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2),

  execute: async (interaction) => {
    try {
      await interaction.deferReply({ ephemeral: false });

      const profilesFolder = `./authCache/${interaction.user.id}`;
      if (!fs.existsSync(profilesFolder)) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('Profiles Folder Missing')
              .setDescription(
                'The required authentication folder is missing. Please link your account using `/link` before running this command.'
              )
              .setColor(0xff0000)
              .setFooter({
                text: `${interaction.user.username} | discord.gg/frosted`,
                iconURL: interaction.user.displayAvatarURL(),
            })
          ],
        });
      }

      const usersFilePath = './data/users.json';
      if (!fs.existsSync(usersFilePath)) {
        throw new Error('No user data found. Please link your account first.');
      }

      const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
      const userData = usersData.find(user => user.userid === interaction.user.id);

      if (!userData || !userData.haslinked) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('Account Not Linked')
              .setDescription('Your account is not linked. Use the `/link` command to link your account first.')
              .setColor(0xff0000)
              .setFooter({
                text: `${interaction.user.username} | discord.gg/frosted`,
                iconURL: interaction.user.displayAvatarURL(),
            })
          ],
        });
      }

      const userIdentifier = undefined;
      const authFlow = new Authflow(userIdentifier, profilesFolder);

      const realmsList = await listRealms(authFlow);

      if (realmsList.errorMsg) {
        throw new Error(realmsList.errorMsg);
      }

      let page = 0;
      const itemsPerPage = 5;
      const totalPages = Math.ceil(realmsList.length / itemsPerPage);

      const generateEmbed = (start) => {
        const current = realmsList.slice(start, start + itemsPerPage);

        const embed = new EmbedBuilder()
          .setTitle('Realms List')
          .setDescription(
            current.map(realm => `**Name**: ${realm.name}\n**ID**: ${realm.id}\n**Status**: ${realm.state === 'OPEN' ? 'Open' : 'Closed'}`).join('\n\n')
          )
          .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

        return embed;
      };
      // buttons goofy ahh in dms
      const generateActionRow = () => {
        return new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('previous')
              .setLabel('Previous')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === 0),
            new ButtonBuilder()
              .setCustomId('next')
              .setLabel('Next')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === totalPages - 1)
          );
      };

      const embedMessage = await interaction.editReply({ embeds: [generateEmbed(0)], components: [generateActionRow()] });

      const filter = (i) => i.customId === 'previous' || i.customId === 'next';
      const collector = embedMessage.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async (i) => {
        if (i.customId === 'previous' && page > 0) {
          page--;
        } else if (i.customId === 'next' && page < totalPages - 1) {
          page++;
        }

        await i.update({ embeds: [generateEmbed(page * itemsPerPage)], components: [generateActionRow()] });
      });

      collector.on('end', () => {
        // buttons goofy ahh in dms
        const disabledRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('previous')
              .setLabel('Previous')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('next')
              .setLabel('Next')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true)
          );
        interaction.editReply({ components: [disabledRow] });
      });

    } catch (e) {
      console.error('Error executing command:', e);
      const errorEmbed = new EmbedBuilder()
        .setDescription(`Error fetching realms list: ${e.message || e}`)

      interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};

async function listRealms(authFlow) {
  const api = RealmAPI.from(authFlow, 'bedrock');

  try {
    return await api.getRealms();
  } catch (error) {
    throw new Error('Could not retrieve realms list');
  }
}
