const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { Authflow, Titles } = require("prismarine-auth");
const crypto = require("node:crypto");
const fs = require("node:fs");
const axios = require("axios");
const axl = require("app-xbox-live");

const curve = "secp384r1";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("link")
        .setDescription("Delete all personal data stored by drex."),
    execute: async (interaction) => {
        if (fs.existsSync(`./data/client/frosted/${interaction.user.id}`)) {
            fs.rmSync(`./data/client/frosted/${interaction.user.id}`, { recursive: true });
        }

        let data = {};
        if (fs.existsSync('./data/client/users.json')) {
            data = JSON.parse(fs.readFileSync('./data/client/users.json', 'utf8'));
            if(data[interaction.user.id].linked) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Already linked!")
                            .setDescription(`you already have linked your account.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: interaction.user.displayAvatarURL() })
                            .setColor(0xffff00),
                    ],
                });
            }
        }

        const client = new Authflow(interaction.user.id, `./data/client/frosted/${interaction.user.id}`, {
            flow: "live",
            authTitle: Titles.MinecraftNintendoSwitch,
            deviceType: "Nintendo",
            doSisuAuth: true
        }, (code) => {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Auth Login")
                        .setDescription(`To sign in, use a web browser to open the page ${code.verification_uri}?otc=${code.user_code} this will give the bot access to your account. If you're not immediately brought to the sign in page, use the code ${code.user_code}.`)
                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: interaction.user.displayAvatarURL() })
                        .setColor(0xffff00),
                ],
                ephemeral: true,
                components: [ 
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Link Account')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`http://microsoft.com/link?otc=${code.user_code ?? "unknown"}`)
                    )
                ]
            });
        });

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
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Auth Timeout")
                        .setDescription(`The authentication process has timed out. Please try again.`)
                        .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: interaction.user.displayAvatarURL() })
                        .setColor(0xff0000)
                ],
            });

        const keypair = crypto.generateKeyPairSync("ec", { namedCurve: curve }).toString("base64");
        const xbl = await client.getXboxToken("rp://playfabapi.com/");
        const info = await client.getXboxToken(); //this is diff to the one above do i know why : no

        const xl = new axl.Account(`XBL3.0 x=${info.userHash};${info.XSTSToken}`);
        const result = await xl.people.get(info.userXUID)
        if (data && Array.isArray(data.people)) {
            console.log(result.people);
        } else {
            console.error('people is undefined or not an array:', result);
        }
        
        try {
            await client.getMinecraftBedrockToken(keypair);
        } catch (e) {
            try {
                await VerifyAccount(`XBL3.0 x=${xbl.userHash};${xbl.XSTSToken}`);
                await client.getMinecraftBedrockToken(keypair);
            } catch {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Auth Timeout")
                            .setDescription(`The authentication process has timed out. Please try again.`)
                            .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: interaction.user.displayAvatarURL() })
                            .setColor(0xff0000)
                    ],
                });
            }
        }


        if (fs.existsSync('./data/client/users.json')) {
            data = JSON.parse(fs.readFileSync('./data/client/users.json', 'utf8'));
        }
    
        data[interaction.user.id] = { 
            linked: true,
            xbox: result.people[0]
         }
    
        fs.writeFileSync('./data/client/users.json', JSON.stringify(data, null, 4));
        interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("Auth Processed")
                    .setDescription(`Your discord account \`${interaction.user.username}\` has been linked to ${result.people[0].displayName}.`)
                    .setThumbnail(result.people[0].displayPicRaw)
                    .setFooter({ text: `${interaction.user.username} | discord.gg/frosted`, iconURL: interaction.user.displayAvatarURL() })
                    .setColor(0x00ff00)
            ],
        });
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
