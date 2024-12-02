const discord = require("discord.js");
const fs = require("node:fs");

module.exports = {
    permission: () => true,
    command: new discord.SlashCommandBuilder()
        .setDescription("Unlink your account from the bot")
        .setDMPermission(true),
    /** @param {discord.ChatInputCommandInteraction} interaction */
    execute: async (interaction) => {
        const userPath = `./authCache/${interaction.user.id}`;
        const usersFilePath = "./data/users.json";

        // Prüfen, ob `authCache` existiert
        if (!fs.existsSync(userPath)) {
            return interaction.reply({
                embeds: [
                    new discord.EmbedBuilder()
                        .setTitle("Unlink Failed")
                        .setDescription("Your account is not linked to the bot.")
                        .setFooter({ text: "You can only unlink accounts that are linked." })
                        .setColor(0xff0000),
                ],
            });
        }

        try {
            fs.rmSync(userPath, { recursive: true, force: true });
            if (fs.existsSync(usersFilePath)) {
                const usersData = JSON.parse(fs.readFileSync(usersFilePath, "utf8"));
                const userEntry = usersData.find(user => user.userid === interaction.user.id);

                if (userEntry) {
                    userEntry.haslinked = false;
                    delete userEntry.xbox; // Entfernt `xbox`-Daten
                }

                fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 4));
            }

            return interaction.reply({
                embeds: [
                    new discord.EmbedBuilder()
                        .setTitle("Unlink Successful")
                        .setDescription("Your account has been successfully unlinked from the bot.")
                        .setFooter({ text: "You can link your account again at any time." })
                        .setColor(0x00ff00),
                ],
            });
        } catch (error) {
            console.error("Error while unlinking user:", error);
            return interaction.reply({
                embeds: [
                    new discord.EmbedBuilder()
                        .setTitle("Unlink Failed")
                        .setDescription("An error occurred while unlinking your account. Please try again later.")
                        .setFooter({ text: "Please Contact an Admin" })
                        .setColor(0xff0000),
                ],
            });
        }
    },
};
