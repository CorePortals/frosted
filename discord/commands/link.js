const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { Authflow, Titles } = require("prismarine-auth");
const crypto = require("node:crypto");
const fs = require("node:fs");
const axios = require("axios");
const axl = require("app-xbox-live");

const curve = "secp384r1";
let data = {};
module.exports = {
    command: new SlashCommandBuilder()
        .setName("link")
        .setDescription("Link your Discord account to your Minecraft account.")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2),
    execute: async (interaction) => {
        await interaction.deferReply();
        try {
            const userId = interaction.user.id;

            let usersData = [];
            if (fs.existsSync('./data/users.json')) {
                usersData = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
            }

            const userEntry = usersData.find(user => user.userid === userId);

            if (userEntry?.haslinked) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Already Linked!")
                            .setDescription("Your account is already linked.")
                            .setColor(0xffff00)
                            .setFooter({ text: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() }),
                    ],
                    ephemeral: true,
                });
            }

            const client = new Authflow(undefined, `./authCache/${interaction.user.id}`, {
                flow: "live",
                authTitle: Titles.MinecraftNintendoSwitch,
                deviceType: "Nintendo",
                doSisuAuth: true,
            }, (code) => {
                interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Auth Login")
                            .setDescription(`To sign in, use a web browser to open the page ${code.verification_uri}?otc=${code.user_code}. If not redirected, use the code **${code.user_code}**.`)
                            .setColor(0xffff00)
                            .setFooter({ text: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() }),
                    ],
                    ephemeral: true,
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setLabel("Link Account")
                                .setStyle(ButtonStyle.Link)
                                .setURL(`http://microsoft.com/link?otc=${code.user_code ?? "unknown"}`)
                        ),
                    ],
                });
            });

            let expired = false;
            await Promise.race([
                client.getXboxToken(),
                new Promise((resolve) =>
                    setTimeout(() => {
                        expired = true;
                        resolve();
                    }, 1000 * 60 * 5)
                ),
            ]);

            if (expired) {
                throw new Error("Authentication process timed out. Please try again.");
            }

            const keypair = crypto.generateKeyPairSync("ec", { namedCurve: curve }).toString("base64");
            const xbl = await client.getXboxToken("rp://playfabapi.com/");
            const info = await client.getXboxToken();

            const xl = new axl.Account(`XBL3.0 x=${info.userHash};${info.XSTSToken}`);
            const result = await xl.people.get(info.userXUID);
            if (!data || !Array.isArray(result.people)) {
                throw new Error("Failed to retrieve Xbox account information.");
            }

            try {
                await VerifyAccount(`XBL3.0 x=${xbl.userHash};${xbl.XSTSToken}`);
                await client.getMinecraftBedrockToken(keypair);
            } catch (authError) {
                await VerifyAccount(`XBL3.0 x=${xbl.userHash};${xbl.XSTSToken}`);
                await client.getMinecraftBedrockToken(keypair);
                throw new Error(`Minecraft authentication failed: ${authError.message}`);
            }

            if (!userEntry) {
                usersData.push({
                    userid: userId,
                    haslinked: true,
                    xbox: result.people[0],
                });
            } else {
                userEntry.haslinked = true;
                userEntry.xbox = result.people[0];
            }

            fs.writeFileSync('./data/users.json', JSON.stringify(usersData, null, 4));

            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Auth Processed")
                        .setDescription(`Your account has been linked to **${result.people[0].displayName}**.`)
                        .setThumbnail(result.people[0].displayPicRaw)
                        .setColor(0x00ff00)
                        .setFooter({ text: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() }),
                ],
            });
        } catch (error) {
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Linking Error")
                        .setDescription(`An error occurred during the linking process:\n\`${error.message}\``)
                        .setColor(0xff0000)
                        .setFooter({ text: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() }),
                ],
                ephemeral: true,
            });
        }
    },
};


/**
 * @name VerifyAccount
 * @param {string} XBL3 - Xbox Live Token
 * @returns {Promise<{XEntityToken: string, PlayFabId: string}>} 
 * @remarks Verifies the XBOX Live Token with Minecraft.
 */
const VerifyAccount = async (XBL3) =>
	new Promise(async (resolve) => {
		console.log(XBL3);
		const myHeaders = new Headers();
		myHeaders.append("Cache-Control", "no-cache");
		myHeaders.append("Accept", "application/json");
		myHeaders.append("Accept-Language", "en-CA,en;q=0.5");
		myHeaders.append("User-Agent", "ibhttpclient/1.0.0.0");
		myHeaders.append("content-type", "application/json; charset=utf-8");
		myHeaders.append("x-playfabsdk", "XPlatCppSdk-3.6.190304");
		myHeaders.append("x-reporterrorassuccess", "true");
		myHeaders.append("Connection", "Keep-Alive");
		myHeaders.append("Host", "20ca2.playfabapi.com");

		const raw = JSON.stringify({
			CreateAccount: true,
			EncryptedRequest: null,
			InfoRequestParameters: {
				GetCharacterInventories: false,
				GetCharacterList: false,
				GetPlayerProfile: true,
				GetPlayerStatistics: false,
				GetTitleData: false,
				GetUserAccountInfo: true,
				GetUserData: false,
				GetUserInventory: false,
				GetUserReadOnlyData: false,
				GetUserVirtualCurrency: false,
				PlayerStatisticNames: null,
				ProfileConstraints: null,
				TitleDataKeys: null,
				UserDataKeys: null,
				UserReadOnlyDataKeys: null,
			},
			PlayerSecret: null,
			TitleId: "20CA2",
			XboxToken: XBL3
		});

		const requestOptions = {
			method: "POST",
			headers: myHeaders,
			body: raw,
			redirect: "follow",
		};

		const BaseEntity = await (await fetch("https://20ca2.playfabapi.com/Client/LoginWithXbox?sdk=XPlatCppSdk-3.6.190304", requestOptions)).json();

		const Entity = {};
		Entity.PlayFabId = BaseEntity.data.PlayFabId;
		Entity.EntityToken = BaseEntity.data.EntityToken.EntityToken;

		const BaseToken = await (await fetch("https://20ca2.playfabapi.com/Authentication/GetEntityToken?sdk=XPlatCppSdk-3.6.190304", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-entitytoken": Entity.EntityToken,
				"Accept-Language": "en-CA,en;q=0.5",
				"Accept-Encoding": "gzip, deflate, br",
				Host: "20ca2.playfabapi.com",
				Connection: "Keep-Alive",
				"Cache-Control": "no-cache",
			},
			body: JSON.stringify({
				Entity: JSON.stringify({
					Id: Entity.PlayFabId,
					Type: "master_player_account",
				}),
			}),
		})).json();

		Entity.XEntityToken = BaseToken.data.EntityToken;

		const info = { XEntityToken: Entity.XEntityToken, PlayFabId: Entity.PlayFabId };
		resolve(info);
	});
