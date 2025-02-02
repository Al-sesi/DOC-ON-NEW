const express = require("express");
const router = express.Router();
const adminAccessTokenValidator = require("../../../../middleware/admin_access_token_validator");

const {
  myTransactions,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  getStatistics
} = require("../controller/transaction_controller");

// Define routes
router.get("/", adminAccessTokenValidator, getAllTransactions);
router.get("/:id", getTransactionById);
router.put("/:id", adminAccessTokenValidator, updateTransaction);
router.get("/mytransactions/:userID", myTransactions);
router.get("/admin/statistics", adminAccessTokenValidator, getStatistics);

module.exports = router;
