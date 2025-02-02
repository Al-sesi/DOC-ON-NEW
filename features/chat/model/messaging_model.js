const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const messageSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4 }, 
    threadId: { type: String, ref: 'Thread', required: true }, // UUID of the thread
    senderId: { type: String, required: true },
    recipientId: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
