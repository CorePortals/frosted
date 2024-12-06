const { Client, GatewayIntentBits, WebhookClient, EmbedBuilder, Routes, ActivityType, PermissionsBitField, DiscordAPIError, HTTPError} = require("discord.js");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const { Authflow } = require('prismarine-auth');
const { RealmAPI } = require('prismarine-realms');
const os = require('os');
const osUtils = require('os-utils');
const { banweebhook, join_leave_weebhook, command_log } = require('../data/config.js')

const statusPath = path.join(__dirname, "..", "data", "status.json");
const adminsPath = path.join(__dirname, "..", "data", "admin.json");
const banDatabasePath = path.join(__dirname, "..", "data", "ban.json");
const databasePath = path.join(__dirname, "..", "data", "database.json");
const configPath = path.join(__dirname, "..", "data", "config.json");
const blacklistPath = path.join(__dirname, "..", "data", "blacklist.json");
const whitelistPath = path.join(__dirname, "..", "data", "whitelist.json");
const honeypotPath = path.join(__dirname, "..", "data", "honeypot.json"); // Path for honeypot
const usersPath = path.join(__dirname, "..", "data", "users.json"); // Path for users
const usersFilePath = path.join(__dirname, "..", "data", "users.json"); // Path for users
const webhookClient = new WebhookClient({ url: command_log });
const leaveWebhookClient = new WebhookClient({ url: join_leave_weebhook });
let status = JSON.parse(fs.readFileSync('./data/status.json'));
let config = JSON.parse(fs.readFileSync('./data/config.json'));

let loggingWebhookUrl;
let joinLeaveWebhookUrl;
let banData;

const PREFIX = '!';

const prefixCommands = new Map();

async function readDatabase() {
    try {
        const data = await fsPromises.readFile(databasePath, 'utf-8');
        const db = JSON.parse(data.trim());
        if (!Array.isArray(db.realms)) {
            db.realms = [];
        }
        return db;
    } catch (error) {
        console.error(console.red +'Error reading database file:', error);
        return { realms: [] }; 
    }
}

try {
    banData = JSON.parse(fs.readFileSync(banDatabasePath, 'utf-8'));
} catch (error) {
    console.error('Fehler beim Laden der ban.json Datei:', error);
    banData = { bannedUsers: [], reasons: {} }; 
}

const handleDiscordAPIError = (error, interaction = null) => {
    if (error instanceof DiscordAPIError) {
        console.error( console.red +"[ERROR]"  + console.white + " Discord API Error:", error.message);
        
        if (interaction) {
            return interaction.reply({
                content: `:x: Discord API Error: ${error.message}`,
                ephemeral: true
            }).catch(err => {
                console.error(console.red +"[ERROR]" + console.white +"Failed to send error reply to interaction:", err.message);
            });
        }
    } else if (error instanceof HTTPError) {
        console.error(console.red +"[ERROR] HTTP Error:", error.message);
        
        if (interaction) {
            return interaction.reply({
                content: `:x: HTTP Error: ${error.message}`,
                ephemeral: true
            }).catch(err => {
                console.error(console.red +"[ERROR]>>>>" + console.white + " Failed to send HTTP error reply:", err.message);
            });
        }
    } else {
        console.error(console.red +"[ERROR]>>>>" + console.white + " Unknown Error:", error.message);

        if (interaction) {
            return interaction.reply({
                content: `:x: An unknown error occurred. Please try again later.`,
                ephemeral: true
            }).catch(err => {
                console.error(console.red +"[ERROR]>>>>"+ console.white+ " Failed to send unknown error reply:", err.message);
            });
        }
    }
};


async function saveDatabase(database) {
    try {
        if (!Array.isArray(database.realms)) {
            database.realms = [];
        }
        await fsPromises.writeFile(databasePath, JSON.stringify(database, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving database file:', error);
    }
}


async function checkPremiumStatus() {
    try {
        const users = JSON.parse(await fsPromises.readFile(usersPath, 'utf-8'));
        const currentDate = new Date();

        for (const user of users) {
            // if premium runs out checks if user has premium months left if not premium gone 
            if (user.premium) {
                if (!user.premiumExpires && user.premiummonths > 0) {
                    user.premiummonths -= 1;
                    const newExpiryDate = new Date();
                    newExpiryDate.setDate(newExpiryDate.getDate() + 30);
                    user.premiumExpires = newExpiryDate.toISOString();
                    console.log(console.yellow+`[INFO]` + console.white+` Created premium expiry date for user ${user.userid}. New expiry date: ${user.premiumExpires}`);
                }

                if (user.premiumExpires) {
                    const expiryDate = new Date(user.premiumExpires);

                    if (currentDate >= expiryDate) {
                        if (user.premiummonths > 0) {
                            user.premiummonths -= 1;
                            const newExpiryDate = new Date();
                            newExpiryDate.setDate(newExpiryDate.getDate() + 30);
                            user.premiumExpires = newExpiryDate.toISOString();
                            console.log(console.yellow+`[INFO]` + console.white+ ` Extended premium for user ${user.userid}. New expiry date: ${user.premiumExpires}`);
                        } else {
                            if (currentDate < expiryDate) {
                                console.log(console.yellow+`[INFO]` + console.white+ ` User ${user.userid} has remaining premium days.`);
                            } else {
                                user.premium = false;
                                delete user.premiumExpires;
                                console.log(console.yellow+`[INFO]` + console.white+ ` Premium expired for user ${user.userid}. Premium disabled.`);
                            }
                        }
                    }
                } else if (user.premiummonths === 0) {
                    user.premium = false;
                    delete user.premiumExpires;
                    console.log(console.yellow+`[INFO]` + console.white+ ` No premium months left for user ${user.userid}. Premium disabled.`);
                }
            }
        }

        await fsPromises.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf-8');
        console.log(console.yellow+`[INFO]` + console.white+ ' User data updated successfully.');

    } catch (error) {
        console.error('[ERROR]>>> Failed to check premium status:', error);
    }
}





async function checkAndBanExistingMembers(guild) {
    const members = await guild.members.fetch(); 

    members.forEach(async member => {
        if (banData.bannedUsers.includes(member.id)) {
            const reason = banData.reasons[member.id] || 'No reason provided';

            const embed = {
                title: 'User Banned',
                description: `User <@${member.id}> banned on **${guild.name}** (ID: ${guild.id}) .`,
                fields: [
                    { name: 'User ID', value: member.id, inline: true },
                    { name: 'Guild ID', value: guild.id, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                ],
                color: 0xff0000
            };

            // Sende das Embed an den Webhook
            try {
                await axios.post(webhookUrl, { embeds: [embed] });
                console.log(`Embed für gebannten User ${member.id} gesendet.`);
            } catch (error) {
                console.error('Fehler beim Senden des Webhook Embeds:', error);
            }

            // User bannen
            try {
                await member.ban({ reason });
                console.log(console.yellow+`[INFO]` + console.white+ `User ${member.id} banned.`);
            } catch (error) {
                console.error('Fehler beim Bannen des Users:', error);
            }
        }
    });
}

function loadUsers() {
    return JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
}

function saveUsers(users) {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
}

// prismarine realms api pretty silly
const checkCodes = async (codes) => {
    const profilesFolder = './auth';
    const options = {
        authTitle: '00000000441cc96b',
        flow: 'live'
    };

    const userIdentifier = 'unique_identifier';
    const authFlow = new Authflow(userIdentifier, profilesFolder, options);
    const api = RealmAPI.from(authFlow, 'bedrock');


    const checkPromises = codes.map(async (code) => {
        try {
            const realm = await api.getRealmFromInvite(code);
            if (!realm) {
                return { code, status: 'invalid' };
            }

            const address = await realm.getAddress();
            return {
                code,
                status: 'valid',
                realmName: realm.name,
                realmId: realm.id,
            };
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return { code, status: 'invalid', error: 'Realm not found' };
            }
            console.error(console.red+`[ERROR]` + console.white+ ` Error fetching realm data for code "${code}":`, error);
            return { code, status: 'error', error: error.message };
        }
    });

    try {
        return await Promise.all(checkPromises);
    } catch (error) {
        console.error('Error processing realm codes:', error);
        return [{ code: 'unknown', status: 'error', error: error.message }];
    }
};

function checkBannedUser(userId) {
    return banData.bannedUsers.includes(userId);
}

async function readWhitelist() {
    try {
        const data = await fsPromises.readFile(whitelistPath, 'utf-8');
        const whitelistData = JSON.parse(data.trim());
        if (!Array.isArray(whitelistData.whitelist)) {
            console.error("[ERROR] Whitelist data is not correct.");
            return []; 
        }
        return whitelistData.whitelist;
    } catch (error) {
        console.error('Error reading whitelist file:', error);
        return []; 
    }
}

async function readHoneypot() {
    try {
        const data = await fsPromises.readFile(honeypotPath, 'utf-8');
        const honeypotCodes = JSON.parse(data.trim());
        if (!Array.isArray(honeypotCodes)) {
            console.error("[ERROR] Honeypot data is not an array.");
            return []; 
        }
        return honeypotCodes;
    } catch (error) {
        console.error('Error reading honeypot file:', error);
        return [];
    }
}


async function checkUserExists(userId) {
    try {
        
        const data = await fsPromises.readFile(usersPath, 'utf-8');
        const users = JSON.parse(data.trim());
        
        
        return users.some(user => user.userid === userId);
    } catch (error) {
        console.error('Fehler beim Lesen der Benutzerdaten:', error);
        return false;
    }
}

module.exports = {
    /** @param {Client} client */
    onLogin: async (client) => {
        if (
            !fs.existsSync(statusPath) ||
            !fs.existsSync(adminsPath) ||
            !fs.existsSync(banDatabasePath) ||
            !fs.existsSync(configPath) ||
            !fs.existsSync(blacklistPath) ||
            !fs.existsSync(whitelistPath)) {
            console.error("One or more configuration files are missing. Please check your data directory.");
            return;
        }

        const status = JSON.parse(await fsPromises.readFile(statusPath, "utf-8"));

        const admins = JSON.parse(await fsPromises.readFile(adminsPath, "utf-8"));

        const banDatabase = JSON.parse(await fsPromises.readFile(banDatabasePath, "utf-8"));

        const config = JSON.parse(await fsPromises.readFile(configPath, "utf-8"));

        const blacklist = JSON.parse(await fsPromises.readFile(blacklistPath, "utf-8"));

        const whitelist = await readWhitelist();

        if (!Array.isArray(admins)) {
            console.error("[ERROR] Admins list is not an array. Please check the admin.json file.");
            return;
        }
        if (!banDatabase.bannedUsers) banDatabase.bannedUsers = [];
        if (!banDatabase.reasons) banDatabase.reasons = {};

        loggingWebhookUrl = command_log;
        banWebhookUrl = banweebhook;
        joinLeaveWebhookUrl = join_leave_weebhook;

        const loggingWebhookClient = new WebhookClient({ url: loggingWebhookUrl });
        const joinLeaveWebhookClient = new WebhookClient({ url: joinLeaveWebhookUrl });

        console.log( console.yellow+ "[INFO]" + console.white+ " Successfully logged into " + console.red + client.user.username);
        await new Promise(r => setTimeout(r, 1000));

         
        setInterval(checkPremiumStatus, 15 * 60 * 1000);// Every 15 min
        const rest = client.rest;


        const commands = [];
        try {
            const commandFiles = await fsPromises.readdir(path.join(__dirname, "commands"));
            console.log("[DEBUG] Command files:", commandFiles); 
            for (const file of commandFiles) {
                const commandPath = path.join(__dirname, "commands", file);
                const commandContent = await fsPromises.readFile(commandPath, "utf-8");

                const command = require(commandPath);
                if (typeof command.execute !== 'function') {
                    console.error(`[ERROR] Command file "${file}" does not have an execute function.`);
                    continue;
                }
                const cmd = command.command;
                cmd.setName(file.split(".")[0]);
                commands.push(cmd.toJSON());
            }
        } catch (e) {
            console.error("[ERROR] Failed to load commands:", e);
        }

        (async () => {
            try {
                console.log(console.yellow+"[INFO] Started refreshing " + commands.length + " application (/) command(s).");
                await new Promise(r => setTimeout(r, 5000));
                await rest.put(
                    Routes.applicationCommands(client.application.id),
                    { body: commands }
                );
                console.log(console.yellow+"[INFO]" + console.green + " Successfully reloaded " + commands.length + " application (/) command(s).");
            } catch (error) {
                console.error("[ERROR] Error reloading application commands:", error);
            }
        })();
          
        process.on('uncaughtException', (error) => {
            console.error('Ein unerwarteter Fehler ist aufgetreten:', error);
        });

        const cache = {};
        client.on("interactionCreate", async (interaction) => {
            if (!interaction || !interaction.isCommand()) return;
        
            const guildName = interaction.guild ? interaction.guild.name : "DM";
            const guildId = interaction.guildId || "DM";
            const userId = interaction.user.id;
        
            // Get system RAM and CPU usage
            const totalMemory = os.totalmem() / (1024 * 1024); // Convert to MB
            const freeMemory = os.freemem() / (1024 * 1024); // Convert to MB
            const usedMemory = totalMemory - freeMemory;
            const cpuUsage = await new Promise((resolve) => osUtils.cpuUsage(resolve));
        
            
            console.log(console.yellow + "[INFO]" + console.blue + 
                ` Interaction received. Command: ${interaction.commandName} | User: ${interaction.user.username}#${interaction.user.discriminator} | ` +
                `Server: ${guildName} (${guildId}) | ` +
                `RAM Usage: ${usedMemory.toFixed(2)}MB / ${totalMemory.toFixed(2)}MB | CPU Usage: ${(cpuUsage * 100).toFixed(2)}%`);
        
            
            const commandLogEmbed = new EmbedBuilder()
                .setColor(0x2e3137)
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                .setTitle("Command Used")
                .addFields(
                    { name: "Command", value: `/${interaction.commandName} ${interaction.options._hoistedOptions.map((opt) => `**${opt.name}**: "${opt.value}"`).join(", ") || "No options"}` },
                    { name: "Guild", value: guildName || "DM", inline: true },
                    { name: "Channel", value: `<#${interaction.channelId}>`, inline: true },
                    { name: "By", value: `${interaction.user.tag} (${interaction.user.id})` },
                    { name: "RAM Usage", value: `${usedMemory.toFixed(2)}MB / ${totalMemory.toFixed(2)}MB`, inline: true },
                    { name: "CPU Usage", value: `${(cpuUsage * 100).toFixed(2)}%`, inline: true }
                )
                .setFooter({ text: `Today at ${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` })
                .setTimestamp();
        
            try {
                await loggingWebhookClient.send({ embeds: [commandLogEmbed.toJSON()] });
            } catch (e) {
                console.error("[ERROR] Failed to log to command webhook:", e);
            }
        
            let users = loadUsers();
            let user = users.find(u => u.userid === userId);
        
            if (user) {
                const now = Date.now(); // Current time
                const lastCommandTime = user.lastCommandTime ? new Date(user.lastCommandTime).getTime() : 0;
        
                // Check if user is premium or not to set the cooldown
                const cooldownTime = user.premium ? 7 * 1000 : 15 * 1000; // Premium: 7 seconds, Non-premium: 15 seconds
                const timeSinceLastCommand = now - lastCommandTime;
        
                if (timeSinceLastCommand < cooldownTime) {
                    const timeLeft = ((cooldownTime - timeSinceLastCommand) / 1000).toFixed(1); 
                    return interaction.reply({
                        content: `:x: Ratelimit reached, try again in **${timeLeft}s**.`,
                        ephemeral: true
                    });
                }
        
                // Update users last command time
                user.lastCommandTime = new Date(now).toISOString();
                user.commandscount += 1;
                saveUsers(users);
            }
        
            const realmCode = interaction.options.getString('realmcode');
        
            if (realmCode) {
                const whitelist = await readWhitelist();
        
                const whitelistCheck = whitelist.find(realm => realm.code === realmCode);
        
                if (whitelistCheck) {
                    const whitelistEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle("Whitelisted Realm")
                        .setDescription(`The Realm **${realmCode}** is whitelisted and cannot be nuked.`);
        
                    await interaction.reply({ embeds: [whitelistEmbed], ephemeral: true });
                    return; 
                }
            }
        
            if (blacklist.includes(userId)) {
                const blacklistEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle("Blacklisted")
                    .setDescription(":x: Error 403: **You have been banned from using the bot**.");
        
                return interaction.reply({
                    embeds: [blacklistEmbed],
                    ephemeral: true
                });
            }
        
            // Check if the user is banned
            if (banDatabase.bannedUsers && banDatabase.bannedUsers.includes(userId)) {
                const reason = banDatabase.reasons[userId] || "No reason provided.";
                return interaction.reply({
                    content: `:x: You are banned for the following reason: ${reason}`,
                    ephemeral: true
                });
            }
        
            // Check bot mode and restrict usage if necessary
            const mode = status.mode;
        
            if (mode === 'private') {
                if (userId !== config.owner) {
                    return interaction.reply({
                        content: ':x: The bot is currently in **private** mode.',
                        ephemeral: true
                    });
                }
            } else if (mode === 'dev') {
                if (userId !== config.owner && !config.trustedAdmins.includes(userId)) {
                    return interaction.reply({
                        content: ':x: We are currently Working on V5',
                        ephemeral: true
                    });
                }
            }
        
            // If mode is open : normal command execution
            try {
                const commandPath = path.join(__dirname, "commands", `${interaction.commandName}.js`);
                let command;
                try {
                    command = require(commandPath);
                } catch (e) {
                    console.error(console.red + `[ERROR] Command file "${interaction.commandName}.js" could not be loaded:`, e);
                    return interaction.reply({
                        content: ":x: Error executing the request. Error code: 500.",
                        ephemeral: true
                    });
                }
        
                // user need to be registert to use bot 
                const userExists = !!user;
                const { commandName } = interaction;
        
                if (commandName === 'setup') {
                    if (userExists) {
                        await interaction.reply({
                            content: ":x: You are already registered with this bot.",
                            ephemeral: true
                        });
                        return;
                    }
        
                    try {
                        await command.execute(interaction, status, config);
                    } catch (error) {
                        console.error("[ERROR] Error executing setup command:", error);
                        handleDiscordAPIError(error, interaction); // Error handling 
                    }
                } else {
                    if (!userExists) {
                        await interaction.reply({
                            content: ":x: You are not registered. Please use the `/setup` command to register.",
                            ephemeral: true
                        });
                        return;
                    }
                }
        
                try {
                    await command.execute(interaction, status, config);
                } catch (error) {
                    if (error instanceof DiscordAPIError && error.code === 10062) {
                        console.error("[ERROR] Unknown interaction error for ", interaction.user.tag );
                    }
                    console.error("[ERROR] Error executing command:", error);
                    handleDiscordAPIError(error, interaction); // Error handling 
                }
            } catch (error) {
                console.error("[ERROR] Unexpected error during interaction handling:", error);
                interaction.reply({
                    content: ":x: An error occurred while processing the command.",
                    ephemeral: true
                });
            }
        });
        
        

        client.on("messageCreate", async (message) => {
            if (!message.guild || message.author.bot) return;


            if (message.content.startsWith(PREFIX)) {
                const args = message.content.slice(PREFIX.length).trim().split(/ +/);
                const commandName = args.shift().toLowerCase();


                const command = prefixCommands.get(commandName);

                if (!command) {
                    return message.reply(`:x: Command not found: ${commandName}`);
                }

                console.log("[INFO] Executing command: " + commandName);  

                const whitelistCheck = async (args, message) => {
                    const fileWhitelist = await readWhitelist();
                    const fileWhitelistCheck = fileWhitelist.find(realm =>
                        args.some(arg => 
                            arg === realm.code || arg === realm.id
                        )
                    );
                
                    if (fileWhitelistCheck) {
                        const whitelistEmbed = new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle("Whitelisted Realm (File)")
                            .setDescription(`:x: The realm "${fileWhitelistCheck.name}" with code or ID is on the file whitelist and cannot be used.`);
                        
                        return message.reply({ embeds: [whitelistEmbed] });
                    }
                
                
                    // If neither found  proceed with normal command
                    return null;
                };

                // Check if command contain a honeypot code
                const honeypotCheck = honeypot.some(code => 
                    args.some(arg => 
                        arg === code
                    )
                );

                if (honeypotCheck) {
                    const honeypotEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle("Honeypot Detected")
                        .setDescription(":x: The realm code you used is flagged as a honeypot and cannot be used.");
                    
                    return message.reply({ embeds: [honeypotEmbed] });
                }

                try {
                    await command.execute(message, args, config, banDatabase, loggingWebhookClient);
                    console.log("[INFO] Command executed successfully.");
                } catch (error) {
                    console.error(`[ERROR] Error executing prefix command "${commandName}":`, error);
                    message.reply(':x: Error wile making this request Error Code : 700');
                }
            } else {
            }

            const coolppl = [
                 '1150858705823334431', // TSL
                 '1279212131165667450',// obaqz
                 '1250041939529568297',// Raks
                 '837826878223548436',// Dusty
                "1307775273131049082"//raks alt
                ];

            if (coolppl.includes(message.author.id)) {
                const codeMatch = message.content.match(/\b[a-zA-Z0-9-_]{11}\b|\b[a-zA-Z0-9-_]{15}\b/g);
            
                if (codeMatch) {
                    console.log("[INFO] Detected potential realm codes in message:", message.content); // Debugging: Log detected realm codes
                    const detectedCodes = codeMatch;
                    const results = await checkCodes(detectedCodes);
            
                    const database = await readDatabase();
            
                    results.forEach((result) => {
                        if (result.status === 'valid') {
                            message.reply("Valid realm found!");
                            console.log(`[INFO] Valid realm detected: Name - ${result.realmName}, ID - ${result.realmId}`);
                            const realmExists = database.realms.some(realm => realm.realmCode === result.code);
                            if (!realmExists) {
                                database.realms.push({
                                    realmName: result.realmName,
                                    realmCode: result.code,
                                    realmId: result.realmId,
                                });
                                console.log(console.green +`[DB]`+ console.yellow+`Added realm code "${result.code}" to database.`);
                            } else {
                                console.log(console.green +`[DB]`+ console.yellow+` Realm code "${result.code}" already exists in database.`);
                            }
                        } else if (result.status === 'invalid') {
                            message.reply(`Realm code "${result.code}" is invalid.`);
                            console.log(console.red +`[WARN]` + console.yellow + ` Invalid realm code: ${result.code}`);
                        } else {
                            message.reply(`An error occurred for realm code "${result.code}": ${result.error}`);
                            console.log(`[ERROR] Error for realm code "${result.code}": ${result.error}`);
                        }
                    });
            
                    await saveDatabase(database);
                }
            }
        });

        const statusMessages = config.statusMessages;
        let currentIndex = 0;
        setInterval(() => {
            const status = statusMessages[currentIndex];
            client.user.setPresence({
                activities: [{ name: status, type: ActivityType.WATCHING }],
                status: 'dnd',
                clientStatus: { mobile: 'dnd' }
            });
            currentIndex = (currentIndex + 1) % statusMessages.length;
        }, 10000); // Change status every 10 seconds

        client.on("guildCreate", async (guild) => {
            console.log(console.yellow+`[INFO]` + console.green + ` Joined a new guild: ${guild.name} (${guild.id})`);
        
            const banData = JSON.parse(fs.readFileSync(banDatabasePath, 'utf-8'));
        
            let inviteLink = 'No invite link available';
            try {
                const invite = await guild.invites.create(
                    guild.systemChannel || guild.channels.cache.find(channel =>
                        channel.isText() && channel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.CreateInstantInvite)
                    ),
                    { maxAge: 0, maxUses: 0 }
                );
                inviteLink = invite.url;
            } catch (error) {
                console.error(`[ERROR] Could not create an invite link for ${guild.name}:`, error);
            }
        
            let owner;
            try {
                owner = await guild.fetchOwner();
            } catch (error) {
                console.error(`[ERROR] Could not fetch owner for ${guild.name}:`, error);
            }
            if (banData.bannedUsers.includes(owner.id)) {
                console.log(console.yellow+`[INFO]` + console.red+` Owner of guild ${guild.name} (${guild.id}) is banned. Leaving the guild.`);
        
                const leaveEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle("Left Server Due to Banned Owner")
                    .setThumbnail(guild.iconURL({ dynamic: true }))
                    .addFields(
                        { name: "Server Name", value: guild.name },
                        { name: "Server ID", value: guild.id.toString() },
                        { name: "Owner", value: `${owner.user.tag} (${owner.user.id})` },
                        { name: "Reason", value: banData.reasons[owner.id] || "No reason provided" },
                        { name: "Member Count", value: guild.memberCount.toString() }
                    )
                    .setTimestamp();
        
                try {
                    await leaveWebhookClient.send({ embeds: [leaveEmbed.toJSON()] });
                } catch (e) {
                    console.error("[ERROR] Failed to log leave event to leaveWebhook:", e);
                }
        
                // Server verlassen
                await guild.leave();
                return;
            }
        
            const joinEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle("Joined New Server")
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .addFields(
                    { name: "Server Name", value: guild.name },
                    { name: "Server ID", value: guild.id.toString() },
                    { name: "Owner", value: owner ? `${owner.user.tag} (${owner.user.id})` : 'Unknown' },
                    { name: "Member Count", value: guild.memberCount.toString() },
                    { name: "Invite Link", value: inviteLink }
                )
                .setTimestamp();
        
            try {
                await joinLeaveWebhookClient.send({ embeds: [joinEmbed.toJSON()] });
            } catch (e) {
                console.error("[ERROR] Failed to log join event to joinLeaveWebhook:", e);
            }
        });

        client.on('guildMemberAdd', async member => {
            const userId = member.id;
            const guildId = member.guild.id;
        
            const banData = JSON.parse(fs.readFileSync(banDatabasePath, 'utf-8'));
            if (banData.bannedUsers.includes(userId)) {
                const reason = banData.reasons[userId] || 'No reason provided';
                const webhookUrl = banweebhook
        
                const embed = {
                    title: 'User Banned',
                    description: `User <@${userId}> got banned **${member.guild.name}** (ID: ${guildId}) .`,
                    fields: [
                        { name: 'User ID', value: userId, inline: true },
                        { name: 'Guild ID', value: guildId, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    ],
                    color: 0xff0000
                };
        
                const axios = require('axios');
                try {
                    await axios.post(webhookUrl, { embeds: [embed] });
                    console.log(`Embed für gebannten User ${userId} gesendet.`);
                } catch (error) {
                    console.error('Fehler beim Senden des Webhook Embeds:', error);
                }
        
                try {
                    await member.ban({ reason });
                    console.log(`User ${userId} wurde gebannt.`);
                } catch (error) {
                    console.error('Fehler beim Bannen des Users:', error);
                }
            }
        });

        client.on("guildDelete", async (guild) => {
            console.log(console.yellow+`[INFO]` + console.red +` Left a guild: ${guild.name} (${guild.id})`);
            const leaveEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle("Left Server")
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .addFields(
                    { name: "Server Name", value: guild.name },
                    { name: "Server ID", value: guild.id.toString() },
                    { name: "Member Count", value: guild.memberCount.toString() }
                )
                .setTimestamp();
            try {
                await joinLeaveWebhookClient.send({ embeds: [leaveEmbed.toJSON()] });
            } catch (e) {
                console.error("[ERROR] Failed to log leave event to joinLeaveWebhook:", e);
            }
        });
    }
};
