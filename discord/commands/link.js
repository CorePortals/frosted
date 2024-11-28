const discord = require("discord.js");
const { Authflow, Titles } = require("prismarine-auth");
const crypto = require("node:crypto");
const fs = require("node:fs");
const curve = "secp384r1";
const axios = require('axios')
module.exports = {
	permission: () => true,
	command: new discord.SlashCommandBuilder().setDescription("Link your account to the bot").setDMPermission(true).setIntegrationTypes(0, 1).setContexts(0, 1, 2),
	/** @param {discord.ChatInputCommandInteraction} interaction */
	execute: async (interaction) => {
		if (fs.existsSync("./authCache/" + interaction.user.id)) fs.rmSync("./authCache/" + interaction.user.id, { recursive: true });
		const client = new Authflow(
            undefined, `./authCache/${interaction.user.id}`,
			{
				flow: "live",
				deviceType: "Nintendo",
				authTitle: Titles.MinecraftNintendoSwitch,
			},
			(code) => {
				interaction.reply({
					embeds: [
						new discord.EmbedBuilder()
							.setTitle("Authentication Processing")
							.setDescription(`To sign in, use a web browser to open the page ${code.verification_uri}?otc=${code.user_code} this will give the bot access to your account. If you're not immediately brought to the sign in page, use the code ${code.user_code}.`)
							.setFooter({ text: "Sign in with the Microsoft account you want to connect to the bot." })
							.setColor(0xffff00),
					],
				});
			}
		);
		let expired = false;
		await Promise.race([
			client.getXboxToken(),
			new Promise((_) =>
				setTimeout(() => {
					expired = true;
					_();
				}, 1000 * 60 * 5)
			),
		]);

		if (expired)
			return interaction.editReply({
				embeds: [new discord.EmbedBuilder().setTitle("Authentication Processed").setDescription(`The authentication process has timed out. Please try again.`).setFooter({ text: "Please try again." }).setColor(0xff0000)],
			});
		const keypair = crypto.generateKeyPairSync("ec", { namedCurve: curve }).toString("base64");

		const xbl = await client.getXboxToken("rp://playfabapi.com/").then((xbl) => "XBL3.0 x=" + xbl.userHash + ";" + xbl.XSTSToken);
		const token = await client.getXboxToken();
		const result = await axios(`https://profile.xboxlive.com/users/xuid(${token.userXUID})/profile/settings?settings=Gamertag,GameDisplayPicRaw,Gamerscore`, {
			headers: { authorization: `XBL3.0 x=${token.userHash};${token.XSTSToken}`, 'x-xbl-contract-version': 2 }
		});

		const gamertag = result.data.profileUsers[0].settings[0].value;
		const gamerpic = result.data.profileUsers[0].settings[1].value;
		const gamerscore = result.data.profileUsers[0].settings[2].value;
		const userXUID = token.userXUID;
		console.log(`${gamertag} ${userXUID}`)
		try {
			await client.getMinecraftBedrockToken(keypair);
		} catch (e) {
			try {
				await VerifyAccount(xbl);
				await client.getMinecraftBedrockToken(keypair);
			} catch {
				return interaction.editReply({
					embeds: [new discord.EmbedBuilder().setTitle("Authentication Processed").setDescription(`The authentication process has timed out. Please try again.`).setFooter({ text: "Please sign in to Minecraft with the Microsoft account you want to connect to the bot." }).setColor(0xff0000)],
				});
			}
		}
		interaction.editReply({
			embeds: [new discord.EmbedBuilder().setTitle("Authentication Processed").setDescription(`You have successfully Linked as **${gamertag}** \n XUID : ${userXUID} \n Gamer Score: ${gamerscore}.`).setFooter({ text: "You can now use the bot." }).setColor(0x00ff00)],
			
		});
	},
};

/**
 * @name playfabHandle
 * @param {string} XBL3 - Xbox Live Token
 * @returns {Promise<{XEntityToken: string, PlayFabId: string}>}
 * @remarks =Verifies the XBOX Live Token with Minecraft!!! ( NO MORE LOGING IN WITH MICROSOFT ACCOUNTS!!! )
 */
const VerifyAccount = async (XBL3) =>
	new Promise(async (resolve) => {
		console.log(XBL3);
		var myHeaders = new Headers();
		myHeaders.append("Cache-Control", "no-cache");
		myHeaders.append("Accept", "application/json");
		myHeaders.append("Accept-Language", "en-CA,en;q=0.5");
		myHeaders.append("User-Agent", "ibhttpclient/1.0.0.0");
		myHeaders.append("content-type", "application/json; charset=utf-8");
		myHeaders.append("x-playfabsdk", "XPlatCppSdk-3.6.190304");
		myHeaders.append("x-reporterrorassuccess", "true");
		myHeaders.append("Connection", "Keep-Alive");
		myHeaders.append("Host", "20ca2.playfabapi.com");

		var raw = `{
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
					XboxToken: "${XBL3}"
				}`;

		var requestOptions = {
			method: "POST",
			headers: myHeaders,
			body: raw,
			redirect: "follow",
		};

		const BaseEntity = await (await fetch("https://20ca2.playfabapi.com/Client/LoginWithXbox?sdk=XPlatCppSdk-3.6.190304", requestOptions)).json();

		const Entity = {};
		Entity.PlayFabId = BaseEntity.data.PlayFabId;
		Entity.EntityToken = BaseEntity.data.EntityToken.EntityToken;

		const BaseToken = await await (
			await fetch("https://20ca2.playfabapi.com/Authentication/GetEntityToken?sdk=XPlatCppSdk-3.6.190304", {
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
			})
		).json();

		Entity.XEntityToken = BaseToken.data.EntityToken;

		const info = { XEntityToken: Entity.XEntityToken, PlayFabId: Entity.PlayFabId };
		resolve(info);
	});

