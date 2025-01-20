const Thread = require('../model/thread_model');

// Create a new thread
exports.createThread = async (req, res) => {
    try {
        const { participants } = req.body;
        const thread = new Thread({ participants });
        await thread.save();
        res.status(201).json(thread);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create thread' });
    }
};

// Get a thread by ID
exports.getThreadById = async (req, res) => {
    try {
        const { id } = req.params;
        const thread = await Thread.findOne({ id }).populate('messages'); //fetch all the associate message
        if (!thread) return res.status(404).json({ error: 'Thread not found' });
        res.status(200).json(thread);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch thread' });
    }
};
