const express = require('express');
const { sendMessage } = require('../controller/messaging_controller');

const router = express.Router();

// Send a message
router.post('/', sendMessage);

module.exports = router;
