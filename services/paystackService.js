const axios = require("axios");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

const headers = {
  Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
  "Content-Type": "application/json",
};

/**
 * Initialize a transaction.
 */
async function initializeTransaction(email, amount) {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      { email, amount },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Paystack Error");
  }
}

/**
 * Verify a transaction.
 */
async function verifyTransaction(reference) {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message || "Paystack Error");
  }
}

module.exports = {
  initializeTransaction,
  verifyTransaction,
};
