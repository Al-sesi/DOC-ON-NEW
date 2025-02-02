const cron = require('node-cron');
const { mongoose } = require('../config/database_config'); // Import the mongoose instance from app.js
const Patient = require('../features/patient/model/patient.model');
const doctorModel = require('../features/doctor/model/doctor.model');
const { Transaction } = require('../features/plans/payments/model/payment.model');
const { BookingSlot } = require("../features/plans/payments/model/booking.model");

// Schedule the cron job to run every day at 12:00 am
exports.watchMan = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      // Find expired subscriptions
      const expiredTransactions = await Transaction.find({
        expirationDate: { $lt: new Date() }, 
        checked: false
      });

      // Update associated patients or doctors
      for (const subscription of expiredTransactions) {
        let updatedUser;
        if (subscription.category === "patient") {
          // Update patient subscription status
          updatedUser = await Patient.findOneAndUpdate(
            { patientID: subscription.subscriberDetails },
            { hasSubscription: false }
          );
          // Remove patient booking slot
          await BookingSlot.findOneAndDelete({ owner: subscription.subscriberDetails });
        } else {
          // Update doctor subscription status
          updatedUser = await doctorModel.findOneAndUpdate(
            { docOnID: subscription.subscriberDetails },
            { hasSubscription: false }
          );
        }
        // Update transaction to reduce the number of transactions to check
        if (updatedUser) {
          await Transaction.findByIdAndUpdate(
            subscription._id,
            { checked: true }
          );
        }
        
      }
      //console.log('Subscription check completed.');
    } catch (error) {
      console.error('Error during subscription check:', error);
    }
  });
  
};
