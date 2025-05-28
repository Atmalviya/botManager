const express = require('express');
const cors = require('cors');
const { redisClient, connectRedis } = require('../config/redis');
const connectDB = require('../config/db');
const Bot = require('../models/Bot');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

connectRedis();
connectDB();

const apiRouter = express.Router();

apiRouter.post('/register', async (req, res) => {
    try {
        const { bot_id, name } = req.body;
        
        await redisClient.set(`bot:${bot_id}:status`, 'active');
        await redisClient.set(`bot:${bot_id}:last_seen`, Date.now());
        await redisClient.sAdd('bots:all', bot_id);
        
        await Bot.findOneAndUpdate(
            { bot_id },
            { 
                bot_id,
                name,
                status: 'active',
                last_heartbeat: new Date()
            },
            { upsert: true }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

apiRouter.post('/health/:bot_id', async (req, res) => {
    try {
        const { bot_id } = req.params;
        const { status, errors } = req.body;

        console.log(`Health check from bot ${bot_id}:`, { status, errors });

        await redisClient.set(`bot:${bot_id}:status`, status);
        await redisClient.set(`bot:${bot_id}:last_seen`, Date.now());

        if (errors && errors.length > 0) {
            await redisClient.lPush(`bot:${bot_id}:errors`, ...errors);
            await redisClient.lTrim(`bot:${bot_id}:errors`, 0, process.env.MAX_ERROR_LOGS - 1);
        }

        await Bot.findOneAndUpdate(
            { bot_id },
            { 
                status,
                last_heartbeat: new Date(),
                ...(errors && { $push: { recent_errors: { 
                    $each: errors.map(e => ({ message: e, timestamp: new Date() })),
                    $slice: -process.env.MAX_ERROR_LOGS 
                }}})
            }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ error: error.message });
    }
});

apiRouter.get('/bots', async (req, res) => {
    try {
        const bots = await Bot.find();
        res.json(bots);
    } catch (error) {
        console.error('Error fetching bots:', error);
        res.status(500).json({ error: error.message });
    }
});

apiRouter.get('/bots/status', async (req, res) => {
    try {
        const botIds = await redisClient.sMembers('bots:all');
        
        const botsStatus = await Promise.all(botIds.map(async (bot_id) => {
            const status = await redisClient.get(`bot:${bot_id}:status`);
            const last_seen = await redisClient.get(`bot:${bot_id}:last_seen`);
            const errors = await redisClient.lRange(`bot:${bot_id}:errors`, 0, 10);
            
            return {
                bot_id,
                status,
                last_seen,
                errors
            };
        }));

        res.json(botsStatus);
    } catch (error) {
        console.error('Error fetching bot status:', error);
        res.status(500).json({ error: error.message });
    }
});

apiRouter.post('/bots/:bot_id/:command', async (req, res) => {
    try {
        const { bot_id, command } = req.params;
        const botPort = process.env.BOT_PORT || 3002;
        
        const botResponse = await fetch(`http://localhost:${botPort}/api/${command}`, {
            method: 'POST'
        });

        if (command === 'stop') {
            await redisClient.set(`bot:${bot_id}:status`, 'inactive');
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Bot command error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.use('/api', apiRouter);

const PORT = process.env.BOT_MANAGER_PORT || 3001;
app.listen(PORT, () => {
    console.log(`Bot Manager running on port ${PORT}`);
}); 