const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now
    },
    message: String,
    level: {
        type: String,
        enum: ['error', 'warn', 'info'],
        default: 'error'
    }
});

const botSchema = new mongoose.Schema({
    bot_id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'error'],
        default: 'inactive'
    },
    last_heartbeat: {
        type: Date,
        default: Date.now
    },
    error_count: {
        type: Number,
        default: 0
    },
    recent_errors: [errorLogSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Bot', botSchema); 