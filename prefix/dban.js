exports.run = async (message, args) => {
    // Überprüfen, ob der Befehl mit einer User-ID ausgeführt wurde
    if (!args[0]) {
        return message.reply('`!ban` is a command to ban a user from the Discord server.\n\nSyntax: !ban <user-id> [reason]');
    }

    const userId = args[0];
    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
        const user = await message.guild.members.fetch(userId);

        if (!user) {
            return message.reply('User not found in this server.');
        }

        if (!user.bannable) {
            return message.reply('I do not have permission to ban this user.');
        }

        await user.ban({ reason });

        message.reply(`Successfully banned **${user.user.tag}** for reason: **${reason}**`);

    } catch (error) {
        console.error('Error banning user:', error);
        message.reply('An error occurred while trying to ban this user. Please check if the user ID is correct and that I have the necessary permissions.');
    }
};
