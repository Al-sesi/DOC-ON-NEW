const mongoose = require("mongoose");
const BookingSlotSchema = new mongoose.Schema(
  {
    owner:String,
    expirationDate:Date,
    video:Number,
    chats:Number,
    booking:Number,
  },
  { timestamps: true }
);

const BookingSlot = mongoose.model("BookingSlot", BookingSlotSchema);
module.exports = {
  BookingSlot
};