const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '..', '..', 'data', 'users.json');

module.exports = {
    command: new SlashCommandBuilder()
        .setName('premiumlookup')
        .setDescription('Displays the premium status of a user.')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check premium status for')
                .setRequired(true)),

    execute: async (interaction) => {
        const user = interaction.options.getUser('user');
        
        const data = fs.readFileSync(filePath, 'utf8');
        let users = JSON.parse(data);

        let userData = users.find(u => u.userid === user.id);

        if (!userData) {
            return interaction.reply({
                content: `User ${user.username} not found in the database.`,
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`Premium Status for ${user.username}`)
            .setTimestamp();

        if (!userData.premium) {
            embed.setDescription('You do not have Premium.');
        } else {
            const monthsLeft = userData.premiummonths || 0;
            const expiryDate = userData.premiumExpires ? new Date(userData.premiumExpires) : null;
            const currentDate = new Date();
            
            let daysLeft = 0;
            if (expiryDate) {
                daysLeft = Math.floor((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
            }
            
            if (userData.cangift && userData.premiumplus) {
                embed.setDescription(`You have **Premium+**  with ${monthsLeft} month(s) and ${daysLeft} day(s) until expiry.`);
            } else if (userData.premium) {
                embed.setDescription(`You have **Basic Premium** with ${monthsLeft} month(s) and ${daysLeft} day(s) until expiry.`);
            } else {
                embed.setDescription('You do not have Premium.');
            }

            if (userData.cangift) {
                embed.addFields({ name: 'Gift Status', value: 'You can gift Premium.', inline: true });
            }
        }

        return interaction.reply({ embeds: [embed], ephemeral: false });
    }
};
