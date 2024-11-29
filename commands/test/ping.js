const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Shows the bot ping/discord latency'),
    async execute(interaction) {
        const embedReply = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Pong!')
            .addFields(
                { name: 'Ping', value: `${interaction.client.ws.ping} ms`, inline: true } //yes tsl only one line!
            )
            .setTimestamp()
            .setFooter({ text: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embedReply] });
    }
};
