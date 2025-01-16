const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require('../../data/discord/config.json');
const fs = require('node:fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("account2")
        .setDescription("View your linked accounts"),
    async execute(interaction) {
        const userId = interaction.user.id;

        const data = JSON.parse(fs.readFileSync('./data/client/users.json', 'utf8'));

        if (!data[userId]) {
            return interaction.reply({ content: "No data found for your account.", ephemeral: true });
        }

        const frostedData = data[userId] || {};
        const jsonRepresentation = `{\n
"Frosted Money": "${frostedData.frosted?.money ?? "0"}",
"Commands Used": "${frostedData.frosted?.cmds ?? "N/A"}"
"Beta Tester": "${frostedData.frosted?.betatester ?? "N/A"}"
"Staff": "${frostedData.frosted?.staff ?? "N/A"}"
"Premium": "${frostedData.frosted?.premium ?? "N/A"}"
"Premiumtime": "${frostedData.frosted?.premiumtime ?? "0"}"\n
"Nuke Stats:"${"----------"}
"Realm Crashes": "${frostedData.frosted?.realmCrashes ?? "0"}"
"Realm Nukes": "${frostedData.frosted?.realmNukes ?? "0"}"
"Honeypot Flagges": "${frostedData.frosted?.honeypotFlagges ?? "N/A"}"

          \n}`;
        const globalEmbed = new  EmbedBuilder()
            .setTitle("Your Frosted Account Overview")
            .setDescription(`\`\`\`json\n${jsonRepresentation}\n\`\`\``)
            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
            .setThumbnail(config.embeds.footerurl)
            .setColor(config.embeds.color);

        await interaction.reply({ embeds: [globalEmbed], ephemeral: true });

        const xboxAccounts = ['xbox1', 'xbox2', 'xbox3'];

        for (const account of xboxAccounts) {
            const accountData = data[userId].xbox[account] || { linked: false };
            const jsonRepresentation2 = [`{\n
"Linked": "${accountData.linked ? "True" : "False"}"
"XUID": "${accountData.linked ? accountData.xbox.xuid || accountData.xuid : "N/A"}"
"GamerTag": "${accountData.linked ? accountData.xbox.gamertag || accountData.xbox.gamertag : "N/A"}"
"Gamer Score": "${accountData.linked ? accountData.xbox.gamerScore || accountData.xbox.gamerScore : "N/A"}"
"Reputation": "${accountData.linked ? accountData.xbox.xboxOneRep || accountData.xbox.xboxOneRep : "N/A"}"
"Account Tier": "${accountData.linked ? accountData.xbox.detail.accountTier || accountData.xbox.detail.accountTier : "N/A"}"

\n}`]
            const accountEmbed = new EmbedBuilder()
                .setTitle(`Account: ${account.charAt(0).toUpperCase() + account.slice(1)}`)
                .setDescription(`\`\`\`json\n${jsonRepresentation2}\n\`\`\``)
                .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: config.embeds.footerurl })
                .setThumbnail(`${accountData.linked ? accountData.xbox.displayPicRaw|| accountData.xbox.displayPicRaw: config.embeds.footerurl}`)
                .setColor(config.embeds.color);

            // Send follow-up for each account
            await interaction.followUp({ embeds: [accountEmbed], ephemeral: true });
        }
    }
};
