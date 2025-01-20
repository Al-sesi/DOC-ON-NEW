const axios = require('axios');
require('dotenv').config();

const authenticateMonnify = async () => {
  const { MONNIFY_API_KEY, MONNIFY_SECRET_KEY, MONNIFY_BASE_URL } = process.env;
  const authString = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');

  try {
    const response = await axios.post(
      `${MONNIFY_BASE_URL}/auth/login`,
      {},
      {
        headers: {
          Authorization: `Basic ${authString}`,
        },
      }
    );

    return response.data.responseBody.accessToken;
  } catch (error) {
    console.error('Error authenticating with Monnify:', error.response?.data || error.message);
    throw error;
  }
};


const createTransaction = async (transactionDetails) => {
  const { MONNIFY_CONTRACT_CODE, MONNIFY_BASE_URL } = process.env;
  const token = await authenticateMonnify();
const {subscriberDetails, planDetails, amount, paymentReference, }=transactionDetails
  try {
    const metadata={
      subscriberDetails,
      planDetails,
      price:amount,
      reference:paymentReference
    }
    const response = await axios.post(
      `${MONNIFY_BASE_URL}/merchant/transactions/init-transaction`,
      {
        ...transactionDetails,
        contractCode: MONNIFY_CONTRACT_CODE,
        metadata
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.responseBody;
  } catch (error) {
    console.error('Error creating transaction:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = createTransaction;

