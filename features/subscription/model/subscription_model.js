const mongoose = require("mongoose");
const subscriptionSchema = new mongoose.Schema(
  {
      subscriptionID:{type:String},
      name: { type: String, required: [true, "Name cannot be empty"]},
      price:{type:Number, required:[true, "Price cannot be empty"]},
      appointmentsBooking:{type:Number, required:[true, "Provide appoitment booking slots"]},
      videoConferencing:{type: Number, required:[true, "Provide number of allowed telecomferencing"]},
      messaging:{type: Number, required:[true, "Provide allowed number of mesaages"]},
   addOn:[String]
      },
  { timestamps: true }
);
exports.Subscription = mongoose.model("Subscription", subscriptionSchema);
