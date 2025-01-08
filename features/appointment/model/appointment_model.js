const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  date: String,
  time: String,
  doctor: {
    type: String,
  },
  patientId: {
    type: String,
  },
  status: { type: String, default: "available" },
  telehealthLink: String,
});

module.exports = mongoose.model("Appointment", appointmentSchema);
