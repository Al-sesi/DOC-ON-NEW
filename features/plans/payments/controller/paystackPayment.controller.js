const { v4 } = require("uuid");
const Transactions= require("../model/payment.model");
const {Subscription}=require("../../subscription/model/subscription_model");
const {
  initializeTransaction,
  verifyTransaction,
} = require("../services/paystackService");

const createTransaction = require('../services/monnifyService');

const initializePatientPayment = async (req, res) => {
  try {
    const { planID } = req.body;
    if (!planID) return res.status(404).json("Subscription ID must be provided");
  const plan= await Subscription.findOne({subscriptionID:planID})
  //Plan Not Found
  if (!plan) return res.status(404).json("Subscription Not Found");
  //Prevent Patient from purchasing Doctor Plans
  if (plan.category==="Doctor") return res.status(404).json("This Subscription type is for Doctors only");
    const email=req.patient.email;
    const price=plan.price;
    
    //Initialize payment
    // const response = await initializeTransaction(email, price * 100); // price in kobo
    const transactionDetails = {
    amount,
    customerName: 'John Doe',
    customerEmail,
    paymentReference, // Ensure this is unique per transaction
    paymentDescription: 'Payment for services',
    currencyCode: 'NGN',
  };
    const transaction = await createTransaction(transactionDetails);

    res.status(200).json({email, price});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const initializeDoctorPayment = async (req, res) => {
  try {
    const { planID, email } = req.body;
    if (!planID) return res.status(404).json("Subscription ID must be provided");
  const plan= await Subscription.findOne({subscriptionID:planID})
  //Plan Not Found
  if (!plan) return res.status(404).json("Subscription Not Found");
  //Prevent Patient from purchasing Doctor Plans
  if (plan.category!=="Doctor") return res.status(404).json("This Subscription type is for Patients only");
    const email=req.doctor.email;
    const price=plan.price;
    
    //const response = await initializeTransaction(email, price * 100); // price in kobo
    
  const transactionDetails = {
    amount:plan.price,
    customerName: 'John Doe',
    customerEmail:email,
    paymentReference, // Ensure this is unique per transaction
    paymentDescription: 'Payment for services',
    currencyCode: 'NGN',
  };
    const transaction = await createTransaction(transactionDetails);

    res.status(200).json({price, email});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  const { reference } = req.params;
  //const {subscriberID, planID}=req.body;
  const { email, subscriberID, planID, price, status } = req.body;
  try {
    //Get purchased plan expiration date
    const plan= await Subscription.findOne({subscriptionID:planID})
    if (!plan) return res.status(404).json("Subscription Not Found");
    
    const duration=plan.duration * 30;
    // Get today's date
    const today = new Date();
     // Add numDay days
    const expirationDate = new Date(today);
   expirationDate.setDate(today.getDate() + duration);
    
    const transaction = new Transactions({
      transactionID: v4(),
      reference,
      subscriberDetails:subscriberID,
      price,
      status,
      planDetails:plan._id,
      expirationDate
    });
    await transaction.save();
//Send neccessary emails/messages if success
    
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//const { amount, customerEmail, paymentReference } = req.body;




module.exports = {
  initializePatientPayment,
  initializeDoctorPayment,
  verifyPayment,
};
