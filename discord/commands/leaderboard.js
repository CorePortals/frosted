const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'data', 'users.json');

const loadUsers = () => {
    try {
        const usersData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(usersData);
    } catch (error) {
        console.error('Error loading users.json:', error);
        return [];
    }
};

module.exports = {
    command: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Displays the top users by coins or commands count.')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .addStringOption(option =>
            option.setName('criteria')
                .setDescription('The criteria for the leaderboard')
                .setRequired(true)
                .addChoices(
                    { name: 'Coins', value: 'coins' },
                    { name: 'Commands Count', value: 'commandscount' }
                )
        ),

    execute: async (interaction) => {
        const criteria = interaction.options.getString('criteria');

        let users = loadUsers();

        if (users.length === 0) {
            return interaction.reply({ content: 'No users found in the database.', ephemeral: true });
        }

        users.sort((a, b) => b[criteria] - a[criteria]);

        // Select top 10 users
        const topUsers = users.slice(0, 10);

        const leaderboard = topUsers.map((user, index) => {
            return `**${index + 1}.** ${user.username} - ${user[criteria]} ${criteria === 'coins' ? 'coins' : 'commands'}`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle(`🏆 Top Users by ${criteria === 'coins' ? 'Coins' : 'Commands Count'}`)
            .setDescription(leaderboard)
            .setTimestamp()
            .setFooter({
                text: `${interaction.user.username} | discord.gg/frosted`,
                iconURL: interaction.user.displayAvatarURL(),
            })

        await interaction.reply({ embeds: [embed] });
    }
};
