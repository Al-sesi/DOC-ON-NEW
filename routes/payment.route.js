// List of imports
const express = require("express");
const router = express.Router();


const {
  initializePayment,
  verifyPayment
} = require("../controllers/payment.controller");

// Routes
router.post("/initialize", initializePayment);
router.post("/verify/:reference", verifyPayment);

module.exports = router;
