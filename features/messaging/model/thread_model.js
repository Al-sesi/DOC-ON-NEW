const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const threadSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4 }, 
    participants: [{ type: String, required: true }], // Array of participant IDs
    messages: [{ type: String, ref: 'Message' }], // Array of message UUIDs
    createdAt: { type: Date, default: Date.now },
});

const Thread = mongoose.model('Thread', threadSchema);

module.exports = Thread;
