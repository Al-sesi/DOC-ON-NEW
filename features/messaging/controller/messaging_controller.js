const Message = require('../model/messaging_model');
const Thread = require('../model/thread_model');

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { threadId, senderId, recipientId, content } = req.body;

        // Create a new message
        const message = new Message({ threadId, senderId, recipientId, content });
        await message.save();

        // Add the message to the thread
        const thread = await Thread.findOne({ id: threadId });
        if (!thread) return res.status(404).json({ error: 'Thread not found' });
        thread.messages.push(message.id);
        await thread.save();

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
};
