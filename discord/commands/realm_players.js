const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { onlineusers } = require('../functions/bedrockrealms');
const { discordInvite, discordlink, footer } = require('../../data/config');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('dump')
        .setDescription('Get not much info on a realm.')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addStringOption(option => 
            option.setName('clubid')
                .setDescription('Club ID')
                .setRequired(true)
                .setMinLength(11)
                .setMaxLength(20)),
    async execute(interaction) {
        const clubID = interaction.options.getString('clubid');

        try{

        const embed = new EmbedBuilder()
            .setTitle('Parsing Data')
            .setDescription(`Fetching realm data this may take a few seconds.`)

            .setColor('#5865F2')
            .setFooter({
                text: `${interaction.user.username} | discord.gg/frosted`,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp(); 
            await interaction.reply({ embeds: [embed] })
        } catch(error){
            if (error.code === 10008 || error.message.includes('Unknown Message')) {
                return; 
            } else {
                console.log(error.message);
            }
        }
        try {
            const realmInfo = await onlineusers(clubID);

            if (!realmInfo) {
                try{

                const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(`Invalid ID given. Please run /realm dump or /Club ID .`)
                .setColor('#5865F2')
                .setFooter({
                    text: `${interaction.user.username} | discord.gg/frosted`,
                    iconURL: interaction.user.displayAvatarURL(),
                })
                .setTimestamp();

                return  interaction.editReply({ embeds: [embed] })
            } catch(error){
                if (error.code === 10008 || error.message.includes('Unknown Message')) {
                    return; 
                } else {
                    console.log(error.message);
                }
            }
            }

            try{

            const embed = new EmbedBuilder()
                .setTitle('Realm Dump Success')
                .setDescription(`\`\`\`json\n${JSON.stringify(realmInfo, null, 2)}\n\`\`\``)
                .setColor('#5865F2')
                .setFooter({ text: footer})
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } catch(error){
            if (error.code === 10008 || error.message.includes('Unknown Message')) {
                return; 
            } else {
                console.log(error.message);
            }
        }
        } catch (error) {
            try{

            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(`\`\`\`json\n${JSON.stringify(error.message, null, 2)}\`\`\``)

                .setColor('#5865F2')
                .setFooter({ text: footer})
                .setTimestamp();  
            return interaction.editReply({ embeds: [embed] })
        } catch(error){
            if (error.code === 10008 || error.message.includes('Unknown Message')) {
                return; 
            } else {
                console.log(error.message);
            }
        }
        }
    },
};