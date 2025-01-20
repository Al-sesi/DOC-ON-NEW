const mongoose = require("mongoose");
const transactionSchema = new mongoose.Schema(
  {
    transactionID:String,
    reference: { type: String, required: true, unique: true },
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
    subscriptionDate:{
      type: Date,
    default: () => new Date().toISOString().split('T')[0], // Store only the date portion
    set: (value) => new Date(value), // Ensure proper Date object is saved
    immutable: true, // Prevent changes to this field
    },
    expirationDate: {
    type: Date,
    default: function () {
      const duration = this.plan.duration * 30; // Convert months to days
      const today = new Date();
      const expirationDate = new Date(today);
      expirationDate.setDate(today.getDate() + duration);
      return expirationDate.toISOString().split('T')[0]; // Store in ISO format
    },
      immutable: true,
    },
    status:{type:String, default:"new"},
    },
  { timestamps: true }
);

    // Ensure expirationDate returns in ISO format
transactionSchema.set('toJSON', { getters: true, virtuals: false });
    
transactionSchema.statics.isEventExpired = function (expirationDate) {
  return new Date() > expirationDate;
};

module.exports = mongoose.model("Transactions", transactionSchema);
