const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { redisClient, connectRedis } = require('../config/redis');
const connectDB = require('../config/db');
const Bot = require('../models/Bot');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Connect to Redis and MongoDB
connectRedis();
connectDB();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle bot registration
    socket.on('register', async (data) => {
        try {
            const { bot_id, name } = data;
            
            // Update or create bot in MongoDB
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

            // Update Redis
            await redisClient.hSet(`bot:${bot_id}`, {
                status: 'active',
                last_seen: Date.now()
            });

            socket.bot_id = bot_id;
            socket.emit('registered', { success: true });
        } catch (error) {
            console.error('Registration error:', error);
            socket.emit('registered', { success: false, error: error.message });
        }
    });

    // Handle heartbeat
    socket.on('heartbeat', async (data) => {
        const { bot_id } = data;
        try {
            await Bot.findOneAndUpdate(
                { bot_id },
                { 
                    status: 'active',
                    last_heartbeat: new Date()
                }
            );

            await redisClient.hSet(`bot:${bot_id}`, {
                status: 'active',
                last_seen: Date.now()
            });
        } catch (error) {
            console.error('Heartbeat error:', error);
        }
    });

    // Handle error reports
    socket.on('error-report', async (data) => {
        const { bot_id, error } = data;
        try {
            const bot = await Bot.findOne({ bot_id });
            if (bot) {
                bot.error_count += 1;
                bot.recent_errors.push({
                    timestamp: new Date(),
                    message: error.message,
                    level: error.level || 'error'
                });

                // Keep only the latest MAX_ERROR_LOGS errors
                if (bot.recent_errors.length > process.env.MAX_ERROR_LOGS) {
                    bot.recent_errors = bot.recent_errors.slice(-process.env.MAX_ERROR_LOGS);
                }

                await bot.save();
                
                // Update Redis
                await redisClient.hSet(`bot:${bot_id}`, {
                    status: 'error',
                    last_error: error.message
                });
            }
        } catch (error) {
            console.error('Error report handling error:', error);
        }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
        if (socket.bot_id) {
            try {
                await Bot.findOneAndUpdate(
                    { bot_id: socket.bot_id },
                    { status: 'inactive' }
                );

                await redisClient.hSet(`bot:${socket.bot_id}`, {
                    status: 'inactive',
                    last_seen: Date.now()
                });
            } catch (error) {
                console.error('Disconnect handling error:', error);
            }
        }
        console.log('Client disconnected:', socket.id);
    });
});

// REST API endpoints
app.get('/api/bots', async (req, res) => {
    try {
        const bots = await Bot.find();
        res.json(bots);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/bots/:bot_id/command', async (req, res) => {
    const { bot_id } = req.params;
    const { command } = req.body;

    try {
        // Emit command to specific bot
        io.emit(`command:${bot_id}`, { command });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.BOT_MANAGER_PORT || 3001;
server.listen(PORT, () => {
    console.log(`Bot Manager running on port ${PORT}`);
}); 