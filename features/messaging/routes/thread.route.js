const express = require('express');
const { createThread, getThreadById } = require('../controller/thread_controller');

const router = express.Router();

// Create a new thread
router.post('/', createThread);

// Get a thread by ID
router.get('/:id', getThreadById);

module.exports = router;
