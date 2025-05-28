const express = require('express');
const path = require('path');
const cors = require('cors');
const { redisClient, connectRedis } = require('../config/redis');
const connectDB = require('../config/db');
const Bot = require('../models/Bot');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

connectRedis();
connectDB();

app.get('/api/bots', async (req, res) => {
    try {
        const bots = await Bot.find();
        console.log("Bots:", bots);
        res.json(bots);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/bots/:bot_id/command', async (req, res) => {
    const { bot_id } = req.params;
    const { command } = req.body;

    try {
        const response = await fetch(`http://localhost:${process.env.BOT_MANAGER_PORT}/api/bots/${bot_id}/command`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ command })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.DASHBOARD_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Dashboard running on port ${PORT}`);
}); 