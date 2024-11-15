const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const paymentModel = mongoose.model("Transactions", transactionSchema);

module.exports = paymentModel;
