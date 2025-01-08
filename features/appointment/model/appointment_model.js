const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  date: String,
  time: String,
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  status: { type: String, default: "available" },
  telehealthLink: String,
});

module.exports = mongoose.model("Appointment", appointmentSchema);
