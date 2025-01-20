const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patientID: {
      type: String,
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    otherNames: { type: String},
    email: { type: String, unique: true, required:true },
    phoneNumber: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    gender: { type: String, required: true },
role: {
    type: String,
    enum: ['doctor', 'patient', 'admin'], // Allowed values
    default: 'patient', // Default role
    required: true,
  },
    contactInformation: [
      {
        address: { type: String, required: true },
        preferredLanguage: { type: String, required: true },
      },
    ],

    password: { type: String, required: true },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    //for OTPs
    otpCode: { type: String },
    otpExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("patients", patientSchema);
