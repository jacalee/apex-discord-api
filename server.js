require('dotenv').config();

const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();

app.use(express.json());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

client.once('ready', () => {
    console.log(`Bot online: ${client.user.tag}`);
});

app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'API Apex Discord online'
    });
});

app.post('/alterar-apelido', async (req, res) => {
    try {
        const key = req.headers['x-api-key'];

        if (!key || key !== API_KEY) {
            return res.status(401).json({
                status: false,
                message: 'Acesso negado'
            });
        }

        const { discord_id, apelido } = req.body;

        if (!discord_id || !apelido) {
            return res.status(400).json({
                status: false,
                message: 'discord_id e apelido são obrigatórios'
            });
        }

        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(discord_id);

        await member.setNickname(apelido);

        return res.json({
            status: true,
            message: 'Apelido alterado com sucesso',
            discord_id,
            apelido
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            status: false,
            message: 'Erro ao alterar apelido',
            error: error.message
        });
    }
});

client.login(BOT_TOKEN);

app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`);
});