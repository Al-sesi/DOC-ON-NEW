const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const threadSchema = new mongoose.Schema({
    threadID: { type: String, default: uuidv4 }, 
    participants: [{ type: String, required: true }], // Array of participant IDs
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }], // Array of message UUIDs
    createdAt: { type: Date, default: Date.now },
    validTill:{type: Date},
    validFrom:{type:Date},
});

const Thread = mongoose.model('Thread', threadSchema);

module.exports = Thread;
