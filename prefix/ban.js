const fs = require('fs');
const path = require('path');

const bansFilePath = path.join(__dirname, '..', 'data', 'discord', 'blacklist.json');

function loadBans() {
    try {
        return JSON.parse(fs.readFileSync(bansFilePath, 'utf-8'));
    } catch (error) {
        console.error('Error loading bans file:', error);
        return [];
    }
}

function saveBans(bans) {
    try {
        fs.writeFileSync(bansFilePath, JSON.stringify(bans, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving bans file:', error);
    }
}

exports.run = async (message, args) => {
    if (args.toString().trim() === '') {
        return message.reply('`!bot` is a command to ban a user from using Frosted .\n\nSyntax: !ban <user-id>');
    }

    const userId = args.toString().trim();
    const user = await message.client.users.fetch(userId).catch(async (error) => {
        return await message.reply('Couldn\'t find that user!');
    });

    if (!user) return;

    const bans = loadBans();

    if (bans.includes(user.id)) {
        return message.reply('This user is already banned from Frosted!');
    }

    // Füge die Benutzer-ID zur JSON-Datei hinzu
    bans.push(user.id);
    saveBans(bans);

    message.reply(`Successfully banned **${user.tag}** from using Frosted!`);
};
