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

client.once('ready', () => {
    console.log(`Bot online: ${client.user.tag}`);
});

app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'API Apex Discord online'
    });
});

app.get('/discord/login', (req, res) => {
    const usuarioId = req.query.id;

    if (!usuarioId) {
        return res.send('ID do usuário não informado.');
    }

    const params = new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        redirect_uri: process.env.REDIRECT_URI,
        response_type: 'code',
        scope: 'identify',
        state: usuarioId
    });

    res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

app.get('/discord/callback', async (req, res) => {
    try {
        const code = req.query.code;
        const usuarioId = req.query.state;

        if (!code || !usuarioId) {
            return res.redirect(`${process.env.SITE_URL}/index.php`);
        }

        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            console.log(tokenData);
            return res.send('Erro ao conectar com o Discord.');
        }

        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });

        const discordUser = await userResponse.json();

        return res.redirect(
            `${process.env.SITE_URL}/discord-retorno.php?key=${process.env.API_KEY}&id=${usuarioId}&discord_id=${discordUser.id}&discord_nome=${encodeURIComponent(discordUser.username)}`
        );

    } catch (error) {
        console.log(error);
        return res.send('Erro interno no callback.');
    }
});

app.post('/alterar-apelido', async (req, res) => {
    try {
        const key = req.headers['x-api-key'];

        if (!key || key !== process.env.API_KEY) {
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

        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        const member = await guild.members.fetch(discord_id);

        await member.setNickname(apelido);

        return res.json({
            status: true,
            message: 'Apelido alterado com sucesso',
            discord_id,
            apelido
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            status: false,
            message: 'Erro ao alterar apelido',
            error: error.message
        });
    }
});

client.login(process.env.BOT_TOKEN);

app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`);
});
