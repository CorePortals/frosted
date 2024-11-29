// realm imports
const bedrock = require('bedrock-protocol')
const { Authflow: PrismarineAuth, Titles } = require('prismarine-auth')
const { RealmAPI } = require('prismarine-realms')

const fs = require('fs');
const path = require('path');
const config = require('../data/discord/config.json');










// used in other shit






// idk why i did this in here i just did
async function checkaccount(interaction) {
    try { // yes this is the error handling LMAO

        let accountsdata;

        try {
            accountsdata = JSON.parse(fs.readFileSync(path.join('./data/client/users.json')));
        } catch (err) {
            return interaction.editReply({ embeds: [
                new EmbedBuilder()
                .setTitle("Account Error")
                .setDescription(`There was a error trying to find your account. Please retry the command, if it keeps happening report it.\n\n\`${err.message}\``)
                .setColor('#7962b8')
            ] 
            });
        }
        

        const accountinfo = accountsdata[interaction.user.id];

        if (!accountinfo) {
            return interaction.editReply({ embeds: [
                new EmbedBuilder()
                .setTitle("Acoount Error")
                .setDescription("You have never used a frosted command. To get started using main realm commands, please do **/link**.")
                .setColor('#7962b8')
            ] 
            });
        }

        return true
    } catch (err) {
        console.log(err)
    }
}






// realm functions

async function dumprealm(invite) {
    const authflow = new PrismarineAuth(undefined, "./data/client/cmdaccounts/dumprealm", { 
        flow: "live", 
        authTitle: Titles.MinecraftNintendoSwitch, 
        deviceType: "Nintendo", 
        doSisuAuth: true 
    });

    const api = RealmAPI.from(authflow, 'bedrock');

    try {
        const realm = await api.getRealmFromInvite(invite);
        const { host, port } = await realm.getAddress();

        const realminfo = { //returns the realm info (small)
            id: realm.id,
            ip: host,
            port: port,
            remoteSubscriptionId: realm.remoteSubscriptionId,
            ownerUUID: realm.ownerUUID,
            name: realm.name,
            motd: realm.motd,
            defaultPermission: realm.defaultPermission,
            state: realm.state,
            daysLeft: realm.daysLeft,
            expired: realm.expired,
            expiredTrial: realm.expiredTrial,
            gracePeriod: realm.gracePeriod,
            worldType: realm.worldType,
            maxPlayers: realm.maxPlayers,
            clubId: realm.clubId,
            member: realm.member
        };
        const dumpeddata = JSON.parse(fs.readFileSync('./data/client/dumpedrealms.json', 'utf8'));
        dumpeddata.push(realminfo);
        await fs.writeFileSync('./data/client/dumpedrealms.json', JSON.stringify(dumpeddata, null, 2));
        return realminfo //works and returns the info
    } catch (err) {
        return null //jst so i can do error handling
    }
}





// Get realm info with a return a full json
async function moredump(invite) {
    const authflow = new PrismarineAuth(undefined, "./data/client/cmdaccounts/dumprealm", { 
        flow: "live", 
        authTitle: Titles.MinecraftNintendoSwitch, 
        deviceType: "Nintendo", 
        doSisuAuth: true 
    });
    const api = RealmAPI.from(authflow, 'bedrock');

    try {
        const realm = await api.getRealmFromInvite(invite);
        const { host, port } = await realm.getAddress();
        const server = await ping({ host: host, port: port });

        const realminfo = {
            id: realm.id,
            ip: host,
            port: port,
            remoteSubscriptionId: realm.remoteSubscriptionId,
            ownerUUID: realm.ownerUUID,
            name: realm.name,
            motd: realm.motd,
            defaultPermission: realm.defaultPermission,
            state: realm.state,
            daysLeft: realm.daysLeft,
            expired: realm.expired,
            expiredTrial: realm.expiredTrial,
            gracePeriod: realm.gracePeriod,
            worldType: realm.worldType,
            maxPlayers: realm.maxPlayers,
            clubId: realm.clubId,
            member: realm.member,
            invite: {
                code: invite,
                ownerxuid: realm.ownerUUID,
                codeurl: "https://realms.gg/" + invite,
            },
            server: {
                motd: server.motd,
                levelname: server.levelName,
                playersonline: server.playersOnline,
                maxplayers: server.playersMax,
                gamemode: server.gamemode ?? "unknown",
                gamemodeid: server.gamemodeId,
                version: server.version,
                protocol: server.protocol
            },
        };
        const dumpeddata = JSON.parse(fs.readFileSync('./data/client/dumpedrealms.json', 'utf8'));
        dumpeddata.push(realminfo);
        await fs.writeFileSync('./data/client/dumpedrealms.json', JSON.stringify(dumpeddata, null, 2));

        return realminfo;
    } catch (error) {
        return null;
    }
}






// same as dumprealm but returns the host and port < edited to have id and name > 
async function gethost(invite, interaction) {

    checkaccount(interaction)
    const authflow = new PrismarineAuth(undefined, "./data/client/cmdaccounts/dumprealm", { 
        flow: "live", 
        authTitle: Titles.MinecraftNintendoSwitch, 
        deviceType: "Nintendo", 
        doSisuAuth: true 
    });

    const api = RealmAPI.from(authflow, 'bedrock');

    try {
        const realm = await api.getRealmFromInvite(invite);
        const { host, port } = await realm.getAddress();

        const realminfo = { //returns the realm info (small)
            id: realm.id,
            ip: host,
            port: port,
            name: realm.name
        };

        return realminfo //works and returns the info
    } catch (err) {
        return null //jst so i can do error handling
    }
}

















async function joinrealm(invite, interaction) { //join the realm
    checkaccount(interaction)

    const authflow = new PrismarineAuth(interaction.user.id, `./data/client/frosted/${interaction.user.id}`, { //keep as user id
        flow: "live",
        authTitle: Titles.MinecraftNintendoSwitch,
        deviceType: "Nintendo",
        doSisuAuth: true
    });

    const yesmommy = await flow.getXboxToken()
	const response = await fetch(`https://pocket.realms.minecraft.net/invites/v1/link/accept/${invite}`, {
		method: "POST",
		headers: {
			...realm_api_headers,
			authorization: `XBL3.0 x=${yesmommy.userHash};${yesmommy.XSTSToken}`
		}
	}).catch(() => {});

	if(response.status !== 200 && response.status !== 403) {
		return {
            errorMsg: errorCodes[response.status] ?? `${response.status} ${response.statusText} ${await response.text()}`
        };
	}

	const realmdata = await response.json();

	if(realmdata.errorMsg) {
        console.log(realmdata.errorMsg)
    }

	return realmdata;
}



















async function leaverealm(invite, interaction) { //join the realm
    //need to make this!!!!!!!
}


module.exports = {
    dumprealm,
    gethost,
    joinrealm,
    leaverealm,
    checkaccount
}
