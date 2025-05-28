const express = require('express');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const DEFAULT_CONFIG = {
    BOT_MANAGER_PORT: 3001,
    BOT_PORT: 3002,
    BOT_HEARTBEAT_INTERVAL: 30000
};

class Bot {
    constructor(name) {
        this.bot_id = uuidv4();
        this.name = name;
        this.isRunning = false;
        this.setupServer();
        this.register();
        this.startHealthCheck();
    }

    setupServer() {
        this.app = express();
        this.app.use(express.json());

        this.app.post('/api/start', (req, res) => {
            this.start();
            res.json({ success: true });
        });

        this.app.post('/api/stop', (req, res) => {
            this.stop();
            res.json({ success: true });
        });

        this.app.post('/api/restart', (req, res) => {
            this.restart();
            res.json({ success: true });
        });

        const port = process.env.BOT_PORT || DEFAULT_CONFIG.BOT_PORT;
        this.app.listen(port, () => {
            console.log(`Bot ${this.name} running on port ${port}`);
        });
    }

    async register() {
        try {
            const botManagerPort = process.env.BOT_MANAGER_PORT || DEFAULT_CONFIG.BOT_MANAGER_PORT;
            console.log(`Attempting to register with Bot Manager on port ${botManagerPort}`);
            
            const response = await fetch(`http://localhost:${botManagerPort}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bot_id: this.bot_id,
                    name: this.name
                })
            });

            const data = await response.json();
            if (data.success) {
                console.log('Successfully registered with Bot Manager');
                this.start();
            } else {
                console.error('Registration failed:', data.error);
            }
        } catch (error) {
            console.error('Registration error:', error);
            setTimeout(() => this.register(), 5000);
        }
    }

    startHealthCheck() {
        const interval = process.env.BOT_HEARTBEAT_INTERVAL || DEFAULT_CONFIG.BOT_HEARTBEAT_INTERVAL;
        const botManagerPort = process.env.BOT_MANAGER_PORT || DEFAULT_CONFIG.BOT_MANAGER_PORT;

        setInterval(async () => {
            if (this.isRunning) {
                try {
                    const hasError = Math.random() < 0.8; 
                    const status = hasError ? 'error' : 'active';
                    const errors = hasError ? ['Random error occurred'] : [];

                    const response = await fetch(`http://localhost:${botManagerPort}/api/health/${this.bot_id}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            status,
                            errors
                        })
                    });

                    const data = await response.json();
                    if (!data.success) {
                        console.error('Health check failed:', data.error);
                    }
                } catch (error) {
                    console.error('Health check error:', error);
                }
            }
        }, interval);
    }

    start() {
        this.isRunning = true;
        console.log(`Bot ${this.name} (${this.bot_id}) started`);
    }

    stop() {
        this.isRunning = false;
        console.log(`Bot ${this.name} (${this.bot_id}) stopped`);
    }

    restart() {
        this.stop();
        setTimeout(() => this.start(), 1000);
    }
}

const bot = new Bot('Sample Bot');

process.on('SIGINT', () => {
    bot.stop();
    process.exit(0);
}); 