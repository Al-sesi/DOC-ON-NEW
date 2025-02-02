const mongoose = require("mongoose");
const transactionSchema = new mongoose.Schema(
  {
    transactionID:String,
    reference: String,
    category:String,
    subscriberDetails: {
    type: String,
    required: true,
    },
    price: { type: Number, required: true },
    planDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true,
      },
    subscriptionDate: {
  type: Date,
  default: () => {
    const today = new Date();
    // Format the date to yyyy-mm-dd and convert back to a Date object
    const formattedDate = new Date(today.toISOString().split('T')[0]);
    return formattedDate;
  },
  set: (value) => new Date(value), // Ensure proper Date object is saved
  immutable: true, // Prevent changes to this field
},
    duration: { type: Number, required: true }, // Duration in months, passed directly
    expirationDate: {
      type: Date,
      default: function () {
        const durationInDays = this.duration * 30; // Convert months to days
        const today = new Date();
        const expirationDate = new Date(today);
        expirationDate.setDate(today.getDate() + durationInDays);
        const expire= expirationDate.toISOString().split("T")[0]; // Store in ISO format
        return expire;
      },
      immutable: true,
    },
    checked:{type:Boolean, default:false},
    status:{type:String, default:"new"},
    },
  { timestamps: true }
);

// Ensure expirationDate returns in ISO format
transactionSchema.set('toJSON', { getters: true, virtuals: false });

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = {
  Transaction
};