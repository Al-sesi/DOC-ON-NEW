const Appointment = require("../model/appointment_model.js");
const Doctor = require("../../doctor/model/doctor.model.js");
const Patient = require("../../patient/model/patient.model.js");
const {
  sendSMS,
  createTwilioRoomAndToken,
} = require("../utils/appointment_utils.js");
const Mailer = require("../../../config/mailer_config");

// Search and filter appointments
const searchAppointments = async (req, res) => {
  try {
    const { date, time, specialty, doctorId } = req.query;
    const filters = { status: "available" };
    if (date) filters.date = date;
    if (time) filters.time = time;
    if (specialty) {
      const doctor = await Doctor.findOne({ specialty });
      filters.doctor = doctor._id;
    }
    if (doctorId) filters.doctor = doctorId;

    const appointments = await Appointment.find(filters).populate("doctor");
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Book new appointment
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, specialty } = req.body;
    const patientId = req.patient.patientID;
    // Validate input
    if (!doctorId || !patientId || !date || !time || !specialty) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Create Twilio Video room and token
    const roomName = `appointment_${doctorId}_${Date.now()}`;
    const { telehealthLink } = await createTwilioRoomAndToken(
      roomName,
      patientName
    );

    // Create and save appointment
    const appointment = new Appointment({
      doctor: doctorId,
      patientId,
      date,
      time,
      specialty,
      status: "booked",
      telehealthLink,
    });

    await appointment.save();

    // Notify the patient and doctor
    await sendEmail(
      doctor.email,
      "You Have New Appointment Scheduled",
      `<p>You have a new appointment with ${req.patient.phoneNumber} on ${date} at ${time}.</p>`
    );

    await Mailer.sendEmail(
      email,
      "Appointment Booked Successfully",
      `Your appointment with Dr. ${doctor.name} is confirmed for ${date} at ${time}.`
    );

    res
      .status(201)
      .json({ message: "Appointment created successfully", appointment });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ message: "Error booking appointment", error });
  }
};

// Waitlist management
const addToWaitlist = async (req, res) => {
  try {
    const { appointmentId, patientId } = req.body;
    const doctorId = req.doctor.doctorID;
    const appointment = await Appointment.findById(appointmentId);
    if (req.appointment.status !== "booked") {
      return res.status(400).json({ error: "Appointment is not booked" });
    }
    if (appointment.doctor !== doctorId) {
      return res.status(401).json({
        error:
          "Unauthorized access. Please make sure the appointment is booked with you",
      });
    }
    appointment.status = appointment.waitlist || [];
    appointment.waitlist.push(patientId);
    await appointment.save();
    res.status(200).json({ message: "Added to waitlist" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeFromWaitlistAndReady = async (req, res) => {
  try {
    const { appointmentId, patientId } = req.body;
    const doctorId = req.doctor.doctorID;
    // Find the appointment by ID
    const appointment = await Appointment.findById(appointmentId);
    if (appointment.doctor !== doctorId) {
      return res.status(401).json({
        error:
          "Unauthorized access. Please make sure the appointment is booked with you",
      });
    }
    // Check if the appointment exists
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Check if the patient is in the waitlist
    if (!appointment.waitlist || !appointment.waitlist.includes(patientId)) {
      return res.status(400).json({ error: "Patient not in waitlist" });
    }

    // Remove the patient from the waitlist
    appointment.waitlist = appointment.waitlist.filter(
      (id) => id.toString() !== patientId
    );

    // Change the appointment status to "ready"
    appointment.status = "ready";

    // Save the updated appointment
    await appointment.save();

    res.status(200).json({
      message: "Removed from waitlist",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Display available slots
//exports.getAvailableSlots = async (req, res) => {
//  try {
//   const { doctorId, date } = req.query;
//   const slots = await Appointment.find({ doctor: doctorId, date, status: "available" });
//  res.status(200).json(slots);
// } catch (error) {
//  res.status(500).json({ error: error.message });
// }
//};

module.exports = {
  removeFromWaitlistAndReady,
  addToWaitlist,
  bookAppointment,
  searchAppointments,
};
