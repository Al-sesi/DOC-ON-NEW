const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");

let doctorSchema = mongoose.Schema({
  professionalInformation: [
    {
      title: { type: String, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      specialty: { type: String, required: true },
      medicalLicenseNumber: { type: String, required: true, unique: true },
      yearsOfExperience: { type: String, required: true },
      gender: { type: String, required: true },
    },
  ],
  contactInformation: [
    {
      address: { type: String, required: true },
      preferredLanguage: { type: String, required: true },
      email: { type: String, unique: true, required: true },
      phoneNumber: { type: String, required: true },
    },
  ],
  credentials: [
    {
      medicalDegree: { type: String, required: true },
      boardCertification: { type: String, required: true },
    },
  ],
  security: [
    {
      password: { type: String, required: true },
    },
  ],
  verification: [
    {
      medicalLicense: { type: String, required: true },
      idProof: { type: String, required: true },
    },
  ],
  CreationDate: { type: Date, default: Date.now },
});

// Hash the password before saving
doctorSchema.pre("save", function (next) {
  if (this.security && this.security[0] && this.isModified("security")) {
    bcrypt.hash(this.security[0].password, 10, (err, hashedPassword) => {
      if (err) return next(err);
      this.security[0].password = hashedPassword;
      next();
    });
  } else {
    next();
  }
});

doctorSchema.methods.validatePassword = function (password, callback) {
  bcrypt.compare(password, this.security[0].password, (err, same) => {
    callback(err, same);
  });
};

const doctorModel = mongoose.model("Doctor", doctorSchema);

module.exports = doctorModel;
