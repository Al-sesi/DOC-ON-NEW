const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

let patientSchema = mongoose.Schema({
  personalInformation: [
    {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, unique: true },
      phoneNumber: { type: String, required: true },
      dateOfBirth: { type: String, required: true },
      gender: { type: String, required: true },
    },
  ],
  contactInformation: [
    {
      address: { type: String, required: true },
      preferredLanguage: { type: String, required: true },
    },
  ],
  security: [
    {
      password: { type: String, required: true },
    },
  ],
  verification: [
    {
      idProof: { type: String, required: true },
    },
  ],
  CreationDate: { type: Date, default: Date.now },
});

let saltRound = 10;

// Hash the password before saving
patientSchema.pre("save", function (next) {
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

patientSchema.methods.validatePassword = function (password, callback) {
  bcrypt.compare(password, this.security[0].password, (err, same) => {
    callback(err, same);
  });
};

let patientModel = mongoose.model("patients", patientSchema);

module.exports = patientModel;
