const fs = require('fs');
const path = require('path');
const config = require('./data/discord/config.json');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({     
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildPresences
    ]
});

client.commands = new Collection();

try {
    const functions = fs.readdirSync(path.join(__dirname, './functions')).filter(file => file.endsWith('.js'));
    const eventFiles = fs.readdirSync(path.join(__dirname, './events')).filter(file => file.endsWith('.js'));
    const commandFolder = fs.readdirSync(path.join(__dirname, './commands'));

    (async () => {
        for (const file of functions) {
            require(path.join(__dirname, './functions', file))(client);
        }
        client.handleEvents(eventFiles, './events');
        client.handleCommands(commandFolder, './commands');
        client.login(config.main.token);
    })();
} catch (error) {
    console.error('Error initializing the bot:', error);
}
