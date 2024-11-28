const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { dumprealm } = require('./functions/bedrockrealms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dump')
        .setDescription('Get not much info on a realm.')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addStringOption(option => 
            option.setName('invite')
                .setDescription('Realm invite code')
                .setRequired(true)
                .setMinLength(11)
                .setMaxLength(15)),
    async execute(interaction) {
        const inviteCode = interaction.options.getString('invite');

        try{

        const embed = new EmbedBuilder()
            .setTitle('Parsing Data')
            .setDescription(`Fetching realm data this may take a few seconds.`)

            .setColor('#5865F2')
            .setFooter({ text: '.gg/frosted'})
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
            const realmInfo = await dumprealm(inviteCode);

            if (!realmInfo) {
                try{

                const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(`Invalid code given. Please check if that is a valid code, **/checkcode**.`)
                .setColor('#5865F2')
                .setFooter({ text: '.gg/frosted'})
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
                .setFooter({ text: '.gg/frosted'})
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
                .setFooter({ text: '.gg/frosted'})
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
