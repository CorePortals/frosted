const fs = require('fs');
const path = require('path');
const prefix = '!';
const allowedUserIds = new Set([
  '1150858705823334431'// tsl
  '1297953123268165655' // obaqz new acc
  '1307775273131049082' // raks new acc
  '837826878223548436' // dusty
  '1279212131165667450' // obaqz old acc
  '1250041939529568297' //raks old acc
]) // only these  users may use prefix commands, do not add anyone else to this without checking with these users first


module.exports = {
  name: 'messageCreate',
  execute(message) {
    if (!message.content.startsWith(prefix) || message.author.bot || !allowedUserIds.has(message.author.id)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const commandPath = path.join(__dirname, '..', 'prefix', `${commandName}.js`);
    if (!fs.existsSync(commandPath)) return;

    const command = require(commandPath);
    try {
      command.run(message, args);
    } catch (error) {
      console.error(error);
      message.reply('There was an error trying to execute that command!');
    }
  }
};
