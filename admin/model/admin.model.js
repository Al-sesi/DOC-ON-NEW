const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    adminID: {
      type: String,
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required:true },
    phoneNumber: { type: String, required: true },
    role: {
    type: String,
      default: 'admin',
      immutable:true,
      // Default role
  },
    password: { type: String, required: true },
    otpCode: { type: String },
    otpExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("admin", adminSchema);
