const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    specialty: { type: String, required: true },
    medicalLicenseNumber: { type: String, required: true, unique: true },
    yearsOfExperience: { type: String, required: true },
    gender: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phoneNumber: { type: String, required: true },

    contactInformation: [
      {
        address: { type: String, required: true },
        preferredLanguage: { type: String, required: true },
      },
    ],
    credentials: [
      {
        medicalDegree: { type: String, required: true },
        boardCertification: { type: String, required: true },
      },
    ],

    password: { type: String, required: true },
    verification: [
      {
        medicalLicense: { type: String, required: true },
        idProof: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("doctors", doctorSchema);
