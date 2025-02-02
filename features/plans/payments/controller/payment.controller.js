const { v4 } = require("uuid");
const {Transaction}= require("../model/payment.model");
const {BookingSlot}= require("../model/booking.model");
const {Subscription}=require("../../subscription/model/subscription_model");
const createTransaction = require('../services/monnifyService');
const {sendEmail}=require("../../../../config/mailer_config")
const Doctor=require("../../../doctor/model/doctor.model")
const Patient=require("../../../patient/model/patient.model")

const initializeDoctorPayment = async (req, res) => {
  try {
    const {planID} = req.body;
    if (!planID) return res.status(404).json("Subscription ID must be provided");
   const plan= await Subscription.findOne({subscriptionID:planID})
   if (!plan) return res.status(404).json("Subscription Not Found");
    
    const email=req.doctor.email;
    const subscriberDetails= req.doctor.docOnID;
    
  //Make sure right user purchase right plan
  if (plan.category!=="Doctor" || !subscriberDetails || !email){
    return res.status(404).json("This Subscription type is for Doctors only");
  }
    //Initialize payment
    const transactionDetails = {
      amount:plan.price,
      customerEmail:email,
      subscriberDetails,
      planDetails:planID,
      reference:v4(),
      paymentDescription: `Payment for ${plan.name} subscription`,
      currencyCode: 'NGN',
  };
    const transaction = await createTransaction(transactionDetails);

    res.status(200).json({email, price});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const initializePatientPayment = async (req, res) => {
  try {
    const {planID} = req.body;
    if (!planID) return res.status(404).json("Subscription ID must be provided");
  
    const plan= await Subscription.findOne({subscriptionID:planID})
  if (!plan) return res.status(404).json("Subscription Not Found");
    
    const email=req.patient.email;
    const subscriberDetails= req.patient.patientID;
   
  //Make sure right user purchase right plan
  if (plan.category==="Doctor" || !email || !subscriberDetails){
  return res.status(404).json("This Subscription type is for Doctors only");
  }
    //Initialize payment
    const transactionDetails = {
      amount:plan.price,
      customerEmail:email,
      subscriberDetails,
      planDetails:planID,
      reference:v4(),
      paymentDescription: `Payment for ${plan.name} subscription`,
      currencyCode: 'NGN',
  };
    const transaction = await createTransaction(transactionDetails);
    res.status(200).json({email, price});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const verifyPayment = async (req, res) => {
  const { eventType, eventData } = req.body;
  try {
    const { subscriberDetails, planDetails, price, reference, email}= eventData.metadata;
      const plan= await Subscription.findOne({subscriptionID:planDetails})
       if (!plan) return res.status(404).json("Subscription Not Found");
   
    if (eventType === 'TRANSACTION_COMPLETED') {
      const transaction = new Transaction({
        transactionID:v4(),
        reference,
        subscriberDetails, 
        planDetails, 
        price,
        duration:plan.duration,
        planDetails:plan._id, //For populate methods
    });
      const newTransaction= await transaction.save();
    
      if(plan.category!=="Doctor"){
        transaction.category="patient";
        transaction.save();
        //Create booking for booking appointment
       const newBook = new BookingSlot({
        video:plan.videoConferencing, 
        chats:plan.messaging, 
        booking:plan.appointmentsBooking,
        owner:subscriberDetails,
        expirationDate:transaction.expirationDate
  });
      const savedBook= await newBook.save();
        const updatePatientSubscription = await Patient.findOneAndUpdate(
          {
            patientID:subscriberDetails,
          },
          { hasSubscription: true }
        );
        if(!updatePatientSubscription)console.log("Unable to Patient sub turned on")
    
      }else{
        transaction.category="doctor";
        transaction.save();
        const updateDoctorSubscription = await Doctor.findOneAndUpdate(
          {
            docOnID:subscriberDetails,
          },
          { hasSubscription: true }
        );
        if(updateDoctorSubscription)console.log("Doctor sub turned on")
      }
      
      //Email subscriber
      const para=plan.category!== "Doctor" ?`book appointments with healthcare professionals.`:`recieve appointments from Patients.`;
      const month = plan.duration > 1 ? 's' : '';
      const successMessage=`<html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          h2 { color: #4CAF50; }
          table { border-collapse: collapse; width: 100%; }
          th, td { padding: 10px; border: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h2>Your Telehealth Subscription is Active!</h2>
     <p>Thank you for subscribing to our telehealth service! Your subscription has been successfully activated, and you can now ${para} </p>
        <h4>Subscription Details:</h4>
        <table>
          <tr>
            <th>Subscription Plan</th>
            <td>${plan.name}</td>
          </tr>
          <tr>
      <th>Duration</th>
            <td>${plan.duration} Month${month}</td>
          </tr>
          <tr>
            <th>Start Date</th>
            <td>${transaction.subscriptionDate.toISOString().split('T')[0]}</td>
          </tr>
          <tr>
            <th>Expiration Date</th>
            <td>${transaction.expirationDate.toISOString().split('T')[0]}</td>
          </tr>
        </table>
        <p>If you have any questions, feel free to contact our support team at <a href="mailto:alsesitechnologies@gmail.com">doconteam</a>.</p>
        <p>Best regards,<br><strong>DocOn</strong><br>alsesitechnologies@gmail.com</p>
      </body>
    </html>
  `;
      sendEmail(
      email,
      `Subscription Successful`,
      successMessage  
    )
      res.status(200).json({newTransaction});
  } else if (eventType === 'TRANSACTION_FAILED') {
    const failedMessage=`
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          h1 { color: #FF6347; }
          table { border-collapse: collapse; width: 100%; }
          th, td { padding: 10px; border: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h3>Subscription Failed: Action Needed</h3>
        <p>We encountered an issue with your subscription to our telehealth service. Unfortunately, your attempt to subscribe was unsuccessful.</p>
        <h5>Details of the Failed Attempt:</h5>
        <table>
          <tr>
            <th>Subscription Plan</th>
            <td>${plan.name}</td>
          </tr>
          <tr>
          <tr>
            <th>Duration</th>
            <td>${plan.duration} Month(s)</td>
          </tr>
          <tr>
            <th>Date of Attempt</th>
            <td>${new Date(Date.now()).toISOString().split('T')[0]}</td>
          </tr>
        </table>
        <p>Possible reasons for failure include:</p>
        <ul>
          <li>Insufficient funds</li>
          <li>Incorrect payment details</li>
          <li>Network or technical issues</li>
        </ul>
        <p>Please review your payment details and try again. If you need any assistance, our support team is ready to help. Contact us at <a href="mailto:Alsesitechnologies@gmail.com">DocOn</a>.</p>
        <p>We look forward to having you join our community and provide you with the healthcare services you need.</p>
        <p>Best regards,<br><strong>Customer Care Unit</strong><br>DocOn</p>
      </body>
    </html>
  `;
    sendEmail(
      email,
      `Subscription Failed`,
      failedMessage  
    )
  //email admin
    console.log('Transaction failed:', eventData);
  }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  initializePatientPayment,
  initializeDoctorPayment,
  verifyPayment,
};
