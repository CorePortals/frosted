const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("node:fs");

module.exports = {
    command: new SlashCommandBuilder()
        .setName('account')
        .setDescription("Displays your linked account .")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2),
    async execute(interaction) {
        const userId = interaction.user.id;
        const usersFilePath = './data/users.json';

        if (!fs.existsSync(usersFilePath)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Data Not Found")
                        .setDescription("No user data was found. You may not have linked an account.")
                        .setColor(0xff0000),
                ],
                ephemeral: true,
            });
        }

        const usersData = JSON.parse(fs.readFileSync(usersFilePath, "utf8"));

        const userData = usersData.find(user => user.userid === userId);

        if (!userData || !userData.haslinked) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Account Not Linked")
                        .setDescription("Your account is not linked. Use the `/link` command to link your account first.")
                        .setColor(0xff0000),
                ],
                ephemeral: true,
            });
        }

        const xboxInfo = userData.xbox || {};

        const accountInfo = `
**Username**: ${userData.username || "Unknown"}
**User ID**: ${userId}
**Coins**: ${userData.coins || "N/A"}
**Command Count**: ${userData.commandscount || "N/A"}
**Premium**: ${userData.premium ? "True" : "False"}
**Gamertag**: ${xboxInfo.gamertag || "Unknown"}
**XUID**: ${xboxInfo.xuid || "Unknown"}
**GamerScores**: ${xboxInfo.gamerScore || "N/A"} 
**XBOX Rep**: ${xboxInfo.xboxOneRep || "N/A"}
**State**: ${xboxInfo.presenceState || "N/A"}
`;

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Account Information")
                    .setDescription(accountInfo)
                    .setThumbnail(xboxInfo.displayPicRaw || interaction.user.displayAvatarURL())
                    .setFooter({
                        text: `${interaction.user.username} | discord.gg/frosted`,
                        iconURL: interaction.user.displayAvatarURL(),
                    })
                
            ],ephemeral: true,
        });
    },
};
