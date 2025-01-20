const { v4 } = require("uuid");
const Appointment = require("../model/appointment_model");
const Doctor = require("../../doctor/model/doctor.model");
const Patient = require("../../patient/model/patient.model");
const { sendSMS, createTwilioRoomAndToken } = require("../utils/appointment_utils");
const Mailer = require("../../../config/mailer_config");

// Search and filter appointments
exports.searchAppointments = async (req, res) => {
  try {
    const { date, time, specialty, docOnID } = req.query;
    const filters = { status: "available" };

    if (date) filters.date = date;
    if (time) filters.time = time;
    if (specialty) {
      const doctor = await Doctor.findOne({ specialty });
      if (doctor) filters.doctor = doctor.docOnID;
    }
    if (docOnID) filters.doctor = docOnID;

    const appointments = await Appointment.find(filters);

    if (!appointments.length) {
      return res.status(400).json({
        title: "Appointment Not Found",
        message: "No appointments match the provided filters. Please try again.",
      });
    }

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${error.message}`,
    });
  }
};

// Book a new appointment
exports.bookAppointment = async (req, res) => {
  try {
    //Allow only patients
    const patientId = req.patient.patientID;
     if(!patientId)return res.status(400).json({ message: "Please login as patient to book apppointment" });
    
    //Collect and validate the required data
    const { doctorId, date, time, specialty } = req.body;
    if (!doctorId || !date || !time || !specialty) {
      return res.status(400).json({ message: "All fields are required" });
    }
     //Check the doctor
    const doctor = await Doctor.findOne({ docOnID: doctorId });
    if (!doctor) {
      return res.status(404).json({
        title: "Doctor Not Found",
        message: "Invalid doctor's credentials provided.",
      });
    }

    const roomName = `appointment_${doctorId}_${Date.now()}`;
    const { telehealthLink, accessToken } = await createTwilioRoomAndToken(roomName, req.patient.name);

    const appointment = new Appointment({
      appointmentID: v4(),
      doctor: doctorId,
      patientId,
      date,
      time,
      specialty,
      status: "available",
      telehealthLink,
      accessToken,
    });

    await appointment.save();

    await Mailer.sendEmail(
      req.patient.email,
      "Appointment Booked Successfully",
      `Your appointment with Dr. ${doctor.name} is confirmed for ${date} at ${time}.`
    );

    await sendSMS(
      req.patient.phoneNumber,
      `Your appointment with Dr. ${doctor.name} is confirmed for ${date} at ${time}.`
    );

    await Mailer.sendEmail(
      doctor.email,
      "New Appointment Scheduled",
      `You have a new appointment with ${req.patient.phoneNumber} on ${date} at ${time}.`
    );

    res.status(201).json({ message: "Appointment created successfully", appointment });
  } catch (error) {
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${error.message}`,
    });
  }
};

// Get appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findOne({ appointmentID: id })
      .populate("doctor")
      .populate("patientId");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add to waitlist
exports.addToWaitlist = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.doctor.docOnID;

    const appointment = await Appointment.findOne({ appointmentID: id });
    if (!appointment) {
      return res.status(404).json({
        title: "Appointment not found",
        message: "Appointment with the provided ID not found",
      });
    }

    if (appointment.doctor !== doctorId) {
      return res.status(401).json({
        title: "Unauthorized Access",
        message: "You are not authorized to waitlist this appointment.",
      });
    }

    if (appointment.status !== "available") {
      return res.status(400).json({
        title: "Appointment Not in Waitlist",
        message: "The appointment is not available for waitlisting.",
      });
    }

    appointment.status = "waiting";
    appointment.waitlist.push(appointment.patientId);
    await appointment.save();

    const patient = await Patient.findOne({ patientID: appointment.patientId });
    await sendSMS(
      patient.phoneNumber,
      `Your appointment with Dr. ${appointment.doctor} has been waitlisted.`
    );

    await Mailer.sendEmail(
      patient.email,
      "Appointment Waitlisted",
      `Your appointment with Dr. ${appointment.doctor} has been waitlisted.`
    );

    res.status(200).json({
      title: "Added to Waitlist",
      message: "Appointment has been added to the waitlist successfully.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove from waitlist and make ready
exports.removeFromWaitlistAndReady = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.doctor.docOnID;

    const appointment = await Appointment.findOne({ appointmentID: id });
    if (!appointment) {
      return res.status(404).json({
        title: "Appointment not found",
        message: "Appointment with the provided ID not found.",
      });
    }

    if (appointment.doctor !== doctorId) {
      return res.status(401).json({
        title: "Unauthorized Access",
        message: "You are not authorized to modify this appointment.",
      });
    }

    if (!appointment.waitlist || !appointment.waitlist.length) {
      return res.status(400).json({
        title: "No Patients in Waitlist",
        message: "The appointment does not have any patients in the waitlist.",
      });
    }

    appointment.status = "available";
    appointment.waitlist = [];
    await appointment.save();

    const patient = await Patient.findOne({ patientID: appointment.patientId });
    await sendSMS(
      patient.phoneNumber,
      `Your appointment with Dr. ${appointment.doctor} is now confirmed and ready to start.`
    );

    await Mailer.sendEmail(
      patient.email,
      "Appointment Confirmed and Ready",
      `Your appointment with Dr. ${appointment.doctor} is now confirmed and ready to start.`
    );

    res.status(200).json({
      title: "Appointment Session Ready",
      message: "Appointment session is now ready to begin with the patient.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};