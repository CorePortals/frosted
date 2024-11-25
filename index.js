const { Authflow } = require("prismarine-auth");
const fetch = require("node-fetch");
const colors = require("colors");
const fs = require("fs");

require("dotenv").config();

const realmArray = [];
const invaildRealmArray = [];

const realmsDBPath = "./data/database.json";

const loadRealmsDB = () => {
    if (!fs.existsSync(realmsDBPath)) {
        return { realms: [] }; 
    }
    const data = fs.readFileSync(realmsDBPath, "utf-8");
    try {
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error parsing the realms database file: ${error}`.red);
        return { realms: [] }; 
    }
};

const saveRealmsDB = (db) => {
    try {
        const data = JSON.stringify(db, null, 2); 
        fs.writeFileSync(realmsDBPath, data);
        console.log("[DB] Realms database has been saved successfully.".green);
    } catch (error) {
        console.error(`Failed to save realms database: ${error}`.red);
    }
};

const isRealmInDB = (realmCode) => {
    const db = loadRealmsDB();
    return db.realms.some(realm => realm.realmCode === realmCode);
};

const addRealmToDB = (realmName, realmCode, realmId) => {
    const db = loadRealmsDB();

    if (isRealmInDB(realmCode)) {
        console.log(`[DB] Realm code ${realmCode} already exists in the database. Skipping.`.yellow);
    } else {
        db.realms.push({
            realmName,  
            realmCode,  
            realmId
        });
        saveRealmsDB(db);
        console.log(`[DB] Added ${realmName} (${realmCode}) to the database.`.green);
    }
};

// Credits to Pokie Vision for LFG Scanner :3
const flow = new Authflow(undefined, "./auth", { 
    flow: "sisu",
    authTitle: "000000004424DA1F",
    deviceType: "Win32"
});

const getTokens = async () => {
    const xToken = await flow.getXboxToken().catch((err) => {
        console.log(err.red);
        process.exit(1);
    });

    const rToken = await flow.getXboxToken("https://pocket.realms.minecraft.net/").catch((err) => {
        console.log(err.red);
        process.exit(1);
    });

    headers.Authorization = `XBL3.0 x=${xToken.userHash};${xToken.XSTSToken}`;
    realm_api_headers.Authorization = `XBL3.0 x=${rToken.userHash};${rToken.XSTSToken}`;

    return;
};

const headers = {
    "x-xbl-contract-version": 107,
    "Accept": "application/json",
    "Accept-Language": "en-US",
    "Authorization": ""
};

const realm_api_headers = {
    "Accept": "*/*",
    "Authorization": "",
    "charset": "utf-8",
    "client-ref": "1d19063e681d13fad3185776a6f83cc1b3565626",
    "client-version": "1.21.30",
    "x-clientplatform": "Windows",
    "x-networkprotocolversion": "712",
    "content-type": "application/json",
    "user-agent": "MCPE/UWP",
    "Accept-Language": "en-US",
    "Accept-Encoding": "gzip, deflate, br",
    "Host": "pocket.realms.minecraft.net",
    "Connection": "Keep-Alive"
};

const regex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d_-]{11,15}/gm;

(async () => {
    await getTokens();

    const fetchCodes = async () => {
        try {
            const posts = await fetch("https://sessiondirectory.xboxlive.com/handles/query?include=relatedInfo,roleInfo,activityInfo", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    "type": "search",
                    "templateName": "global(lfg)",
                    "orderBy": "suggestedLfg desc",
                    "communicatePermissionRequired": true,
                    "includeScheduled": true,
                    "filter": "session/titleId eq 1828326430 and session/roles/lfg/confirmed/needs ge 1"
                })
            }).catch(() => { });
    
            const data = await posts.json();
    
            console.log("[-] Grabbing Realm Codes".yellow);
    
            for (let i = 0; i < data.results.length; i++) {
                if (!data.results[i].relatedInfo?.description) continue;
    
                const realmCodes = data.results[i].relatedInfo.description.text.match(regex);
    
                if (realmCodes) {
                    for (let j = 0; j < realmCodes.length; j++) {
                        if (realmArray.includes(realmCodes[j]) || invaildRealmArray.includes(realmCodes[j])) continue;
    
                        console.log(`[${realmCodes[j]}] Validating Realm Code`.magenta);
    
                        const response = await fetch(`https://pocket.realms.minecraft.net/worlds/v1/link/${realmCodes[j]}`, {
                            method: "GET",
                            headers: realm_api_headers
                        }).catch(() => { });
    
                        const realm = await response.json();
    
                        switch (response.status) {
                            case 403:
                                console.log(`[${realmCodes[j]}] Found in blocklist`.red);
                                realmArray.push(realmCodes[j]);
                                break;
                            case 404:
                                console.log(`[${realmCodes[j]}] Invalid Realm Code`.red);
                                invaildRealmArray.push(realmCodes[j]);
                                break;
                            case 200:
                                const realmId = realm.id;
                                const realmName = realm.name;
    
                                console.log(`[${realmCodes[j]}] Valid Realm Code`.green);
                                console.log(`Realm ID: ${realmId}, Realm Name: ${realmName}`.cyan);
    
                                realmArray.push(realmCodes[j]);
    
                                addRealmToDB(realmName, realmCodes[j], realmId);
    
                                break;
                            case 401:
                                console.log(`[${realmCodes[j]}] Unable to retrieve realm code, refreshing tokens.`.red);
                                await getTokens();
                                break;
                            default:
                                console.log(`[${realmCodes[j]}] Unable to retrieve realm code`.red);
                                break;
                        }
                    }
                }
            }
    
            console.log("[-] Finished Grabbing Realm Code(s)".yellow);
        } catch (error) {
            console.log(error.red);
            console.log("[-] Something went wrong".red);
        }
    };
    

    fetchCodes();

    setInterval(() => { fetchCodes(); }, 60000);
})();


console = { ...console, ...colors };
const _o_write = process.stdout.write;
Object.defineProperties(String.prototype, {
    "clean": {
        get: function() {
            const nonUTF8Regex = /[^\x00-\x7F]/g;
            return this.toString().replace(nonUTF8Regex, '').replace(/\x1B\[.*?m/g, '');
        }
    }
});

const logStream = fs.createWriteStream(__dirname + "/stdout.log", { flags: 'a' }); 
process.stdout.write = function(buffer, encoding, cb) {
    buffer = buffer + console.default;
    logStream.write(buffer.clean);
    _o_write.apply(this, arguments);
};

const config = require(__dirname + "/config.json");
const discord = require("discord.js");

const client = new discord.Client({ intents: 32767 });

client.login(config.token).then(() => require("./discord/index.js").onLogin(client));