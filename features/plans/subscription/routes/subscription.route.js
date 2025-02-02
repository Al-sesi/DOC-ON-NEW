const express = require("express");
const router = express.Router();
const adminAccessTokenValidator = require("../../../../middleware/admin_access_token_validator");

const {
  getAllSubscriptions,
  createSubscription,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
} = require("../controller/subscription_controller");

// Define routes
router.get("/", getAllSubscriptions);
router.post("/", adminAccessTokenValidator, createSubscription);
router.get("/:id", getSubscriptionById);
router.put("/:id", adminAccessTokenValidator, updateSubscription);
router.delete("/:id", adminAccessTokenValidator, deleteSubscription);

module.exports = router;
