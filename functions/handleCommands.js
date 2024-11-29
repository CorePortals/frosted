const { REST, SlashCommandBuilder } = require("discord.js");
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const config = require('../data/discord/config.json');


module.exports = (client) => {
    client.handleCommands = async (commandFolders, path) => {
        client.commandArray = [];
        for (folder of commandFolders) {
            const commandFiles = fs.readdirSync(`${path}/${folder}`).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const command = require(`../commands/${folder}/${file}`);
                client.commands.set(command.data.name, command);
                client.commandArray.push(command.data.toJSON()); 

            }
        }

        const rest = new REST({
            version: '9'
        }).setToken(config.main.token);

        (async () => {
            try {

                await rest.put(
                    Routes.applicationCommands(config.main.id), {
                        body: client.commandArray
                    },
                );

            } catch (error) {
                console.error(error.message);
            }
        })();
    };
};