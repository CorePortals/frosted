const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fsPromises = require('fs').promises;
const path = require('path');
const { cat1 } =require('../../data/emojie.js')

const usersPath = path.join(__dirname, '..', '..', 'data', 'users.json');

async function saveUserData(users) {
    await fsPromises.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf-8');
}

async function loadUserData() {
    const data = await fsPromises.readFile(usersPath, 'utf-8');
    return JSON.parse(data.trim());
}

module.exports = {
    command: new SlashCommandBuilder()
        .setName('slot')
        .setDescription('slot machine')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2),
    async execute(interaction) {
        const userId = interaction.user.id;
        const users = await loadUserData();
        let user = users.find(u => u.userid === userId);
        
        if (!user) {
            user = {
                userid: userId,
                coins: 0,
            };
            users.push(user);
        }

        const symbols = ['🍒', '🍋', '🍊', '⭐', '7️⃣'];

        const embed = new EmbedBuilder()
            .setTitle(`${cat1} Slot Machine ${cat1}`)
            .setDescription('Initial Result:\n' + generateRandomGrid(symbols));

        // Send the initial embed
        await interaction.reply({ embeds: [embed] });

        // Store final results
        let finalResults = [[], [], []];

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 5; j++) {
                const spinningResults = [
                    symbols[Math.floor(Math.random() * symbols.length)],
                    symbols[Math.floor(Math.random() * symbols.length)],
                    symbols[Math.floor(Math.random() * symbols.length)],
                ];

                embed.setDescription(`Spinning Column ${i + 1}...\n${generateGrid(finalResults, i, spinningResults)}`);
                await interaction.editReply({ embeds: [embed] });
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait for 500ms 
            }

            finalResults[i] = [
                symbols[Math.floor(Math.random() * symbols.length)],
                symbols[Math.floor(Math.random() * symbols.length)],
                symbols[Math.floor(Math.random() * symbols.length)],
            ];
        }

        const finalResultText = finalResults[0].map((_, colIndex) => 
            finalResults.map(row => row[colIndex]).join(' ')
        ).join('\n');

        let coinsWon = 0;

        for (let col of finalResults) {
            if (col[0] === '7️⃣' && col[1] === '7️⃣' && col[2] === '7️⃣') {
                coinsWon = 500; // Win for three 7s
                break;
            }
        }

        if (coinsWon > 0) {
            user.coins += coinsWon;
            embed.setDescription(`🎉 You won ${coinsWon} coins! 🎉\nFinal Result:\n${finalResultText}`);
        } else {
            user.coins -= 0; 
            embed.setDescription(`😢 You lost 0 coins.\nFinal Result:\n${finalResultText}`);
        }

        await saveUserData(users);
        
        await interaction.editReply({ embeds: [embed] });
    },
};

function generateRandomGrid(symbols) {
    return [
        [symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)]],
        [symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)]],
        [symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)]],
    ].map(row => row.join(' ')).join('\n');
}

function generateGrid(finalResults, currentColumn, spinningResults) {
    const grid = [];
    for (let row = 0; row < 3; row++) {
        const currentRow = [];
        for (let col = 0; col < 3; col++) {
            if (col === currentColumn) {
                currentRow.push(spinningResults[row]); 
            } else {
                currentRow.push(finalResults[col][row] || '❓'); 
            }
        }
        grid.push(currentRow);
    }
    return grid.map(row => row.join(' ')).join('\n');
}
