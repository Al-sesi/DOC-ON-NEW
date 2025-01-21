const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  appointmentID: {
    type: String,
  },
  date: { type: String, required: true },
  time: { type: String, required: true },
  doctorId: {
    type: String,
    ref: "Doctor",
    required: true,
  },
  patientId: {
    type: String,
    ref: "Patient",
    required: true,
  },
  speciality: { type: String, required: true },
  status: { type: String, default: "available" },
  telehealthLink: { type: String, required: true },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
