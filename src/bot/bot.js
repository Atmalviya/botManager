const { io } = require('socket.io-client');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

class Bot {
    constructor(name) {
        this.bot_id = uuidv4();
        this.name = name;
        this.socket = io(`http://localhost:${process.env.BOT_MANAGER_PORT || 3001}`);
        this.isRunning = false;
        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        this.socket.on('connect', () => {
            console.log('Connected to Bot Manager');
            this.register();
        });

        this.socket.on('registered', (response) => {
            if (response.success) {
                console.log('Successfully registered with Bot Manager');
                this.startHeartbeat();
                this.start();
            } else {
                console.error('Registration failed:', response.error);
            }
        });

        this.socket.on(`command:${this.bot_id}`, ({ command }) => {
            this.handleCommand(command);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from Bot Manager');
            this.isRunning = false;
        });
    }

    register() {
        this.socket.emit('register', {
            bot_id: this.bot_id,
            name: this.name
        });
    }

    startHeartbeat() {
        setInterval(() => {
            if (this.isRunning) {
                this.socket.emit('heartbeat', { bot_id: this.bot_id });
            }
        }, process.env.BOT_HEARTBEAT_INTERVAL || 30000);
    }

    start() {
        this.isRunning = true;
        console.log(`Bot ${this.name} (${this.bot_id}) started`);
        
        // Simulate random errors for testing
        setInterval(() => {
            if (this.isRunning && Math.random() < 0.1) { // 10% chance of error
                this.reportError('Random error occurred');
            }
        }, 60000);
    }

    stop() {
        this.isRunning = false;
        console.log(`Bot ${this.name} (${this.bot_id}) stopped`);
    }

    reportError(message) {
        this.socket.emit('error-report', {
            bot_id: this.bot_id,
            error: {
                message,
                level: 'error'
            }
        });
    }

    handleCommand(command) {
        switch (command) {
            case 'start':
                this.start();
                break;
            case 'stop':
                this.stop();
                break;
            case 'restart':
                this.stop();
                setTimeout(() => this.start(), 1000);
                break;
            default:
                console.log(`Unknown command: ${command}`);
        }
    }
}

// Create and start a sample bot
const bot = new Bot('Sample Bot');

// Handle process termination
process.on('SIGINT', () => {
    bot.stop();
    process.exit(0);
}); 