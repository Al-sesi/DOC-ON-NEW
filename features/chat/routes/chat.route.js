const express = require("express");
const {
    createThread,
    sendMessage,
    getThreadsByUser,
    getMessagesByThread,
} = require("../controller/chat_controller");

const router = express.Router();
const doctorAccessTokenValidator = require("../../../middleware/doctor_access_token_validator");
const patientAccessTokenValidator = require("../../../middleware/patient_access_token_validator");

// Routes
router.post("/patient/threads", patientAccessTokenValidator, createThread);
router.post("/doctor/threads", doctorAccessTokenValidator, createThread);

router.post("/patient/send-message", patientAccessTokenValidator, sendMessage);
router.post("/doctor/send-message", doctorAccessTokenValidator, sendMessage);

router.get("/patient/threads/:userId", patientAccessTokenValidator, getThreadsByUser);
router.get("/doctor/threads/:userId", doctorAccessTokenValidator, getThreadsByUser);

router.get("/patient/threads/:threadId/messages", patientAccessTokenValidator, getMessagesByThread);
router.get("/doctor/threads/:threadId/messages", doctorAccessTokenValidator, getMessagesByThread);

module.exports = router;
