# Bot Monitor System

A simple multi-bot architecture with monitoring capabilities. This system allows you to manage and monitor multiple bots through a centralized dashboard.

## Features

- Real-time bot status monitoring
- Centralized bot management (start/stop/restart)
- Error logging and tracking
- Redis-based caching for fast status updates
- MongoDB for persistent storage
- Modern web dashboard interface

## Prerequisites

- Node.js (v14 or higher)
- Redis Server
- MongoDB Server
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd botMonitor
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
# Server Ports
DASHBOARD_PORT=3000
BOT_MANAGER_PORT=3001

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/botmonitor

# Bot Configuration
BOT_HEARTBEAT_INTERVAL=30000
DASHBOARD_POLL_INTERVAL=5000

# Log Configuration
MAX_ERROR_LOGS=50
```

## Running the System

1. Start Redis Server:
```bash
redis-server
```

2. Start MongoDB Server:
```bash
mongod
```

3. Start the Bot Manager:
```bash
npm run bot-manager
```

4. Start the Dashboard:
```bash
npm run dashboard
```

5. Start a sample bot:
```bash
npm run bot
```

You can start multiple bots by running the bot command in different terminals.

## Accessing the Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

## System Architecture

### Components

1. **Dashboard Service**
   - Web interface for monitoring and managing bots
   - Real-time updates via polling
   - Bot control interface

2. **Bot Manager**
   - Central management of all bot instances
   - Handles bot registration and health monitoring
   - Processes bot commands

3. **Redis Cache**
   - Stores real-time bot status
   - Caches recent error logs
   - Provides fast access to bot information

4. **MongoDB Database**
   - Persistent storage for bot information
   - Historical error logs
   - System configuration

5. **Bot Instances**
   - Individual bot processes
   - Regular heartbeat updates
   - Error reporting
   - Command handling

## API Endpoints

### Dashboard API

- `GET /api/bots` - Get list of all bots
- `POST /api/bots/:bot_id/command` - Send command to a bot

### Bot Manager API

- `GET /api/bots` - Get list of all bots
- `POST /api/bots/:bot_id/command` - Execute command on a bot

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 