const {
  initializeTransaction,
  verifyTransaction,
} = require("../services/paystackService");

const initializePayment = async (req, res) => {
  const { email, amount } = req.body;
  try {
    const response = await initializeTransaction(email, amount * 100); // Amount in kobo
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  const { reference } = req.params;
  try {
    const response = await verifyTransaction(reference);
    const { email, amount, status } = response.data;

    // Save to database
    const transaction = new Transaction({
      reference,
      email,
      amount,
      status,
    });
    await transaction.save();

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
};
