const { v4 } = require("uuid");
const Appointment = require("../models/Appointment");
const doctorModel = require("../doctor/model/doctor.model");
const Patient = require("../patient/model/patient.model");
const Appointment = require("../models/Appointment");
const patientAccessTokenValidator = require("../../../middleware/patient_access_token_validator");
const { sendSMS, createTwilioRoomAndToken } = require("../utilts/appointment_utils");
const Mailer = require("../../../config/mailer_config");

// Search and filter appointments
exports.searchAppointments = async (req, res) => {
  try {
    const { date, time, specialty, doctorId } = req.query;
    const filters = { status: "available" };
    if (date) filters.date = date;
    if (time) filters.time = time;
    if (specialty) {
      const doctor = await Doctor.findOne({ specialty });
      filters.doctor = doctor.docOnID;
    }
    if (docOnID) filters.doctor = docOnID;

    const appointments = await Appointment.find(filters).populate("doctor");
    if(!appointments){
     return res.status(400).json({
          title: "Appointment Not Found",
          message:
            "The appointment with input query parameter is not available, please check your parameters and try again"
        })
    }
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${error.message}`,
    });
  }
};

//Book new appointment
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, specialty } = req.body;
    const patientId=req.patient.patientID
    // Validate input
    if (!doctorId || !patientId || !date || !time || !specialty) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if doctor exists
    const doctor = await Doctor.findOne(docOnID:doctorId);
    if (!doctor) {
      return res.status(404).json({ 
        title:"Doctor's Id Not Found"
        message: "Invalid Doctor's credentials provided." });
    }

    // Create Twilio Video room and token
    const roomName = `appointment_${doctorId}_${Date.now()}`;
    const { telehealthLink, accessToken } = await createTwilioRoomAndToken(roomName, patientName);

    // Create and save appointment
    const appointment = new Appointment({
      appointmentID: v4(),
      doctor: doctorId,
      patientId,
      date,
      time,
      specialty,
      status: "available",
      telehealthLink,
      accessToken
    });
    
    await appointment.save();
    
   // Notify the patient and doctor
      await Mailer.sendEmail(
        req.patient.email,
        "Appointment Booked Successfully",
        `Your appointment with Dr. ${doctor.name} is confirmed for ${date} at ${time}.`
    )
    
    await sendSMS(
    req.patient.phoneNumber,
    `Your appointment with Dr. ${doctor.name} is confirmed for ${date} at ${time}.`
    )
    
    //Notify Doctor
    await Mailer.sendEmail(
      doctor.email,
      "You Have New Appointment Scheduled",
      `<p>You have a new appointment with ${req.patient.phoneNumber} on ${date} at ${time}.</p>`
    );
    
    res.status(201).json({ message: "Appointment created successfully", appointment });
  } catch (error) {
    //console.error("Error booking appointment:", error);
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${error.message}`,
     })
};
  
  //Get appoitment By ID
exports.getAppointmentById = async (req, res) => {
  try {
    const {id} = req.params;
    // Find appointment by ID using `findOne`
    const appointment = await Appointment.findOne({ appointmentID : id });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    // Send the appointment as a response
    res.status(200).json(appointment);
  } catch (error) {
    console.error("Error finding appointment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
  
// Waitlist management
exports.addToWaitlist = async (req, res) => {
  try {
    const {id} = req.params;
    const doctorId=req.doctor.docOnID;
    const appointment = await Appointment.findOne(appointmentID: id);
   if (!appointment) {
      return res.status(404).json({ title: "Appointment not found",
message:"Appointment with the provided id not found"      });
    }
    //Ensure only rightful owner of appointment can waitlist it
   if (appointment.doctor!==doctorId) {
      return res.status(401).json({title: "Unauthorized Access",
          message:
            "You are not authorised to waitlist this appointment. Please ensure the appointment was booked with you " });
    }
    
    if (appointment.status !== "available") {
      return res.status(400).json({ title: "Appointment Not in Waitlist",
          message:
            "The appointment with provided id not found or unavailable" });
    }
    
    appointment.status= "waiting";
    appointment.waitlist.push(appointment.patientId);
    await appointment.save();
    
    
   const patient = await Patient.findOne({ patientID: appointment.patientId });
    await sendSMS(
    patient.phoneNumber,
    `Your appointment with Dr. ${doctor.name} has been waitlisted. We’ll notify you once a slot opens. Thank you!`
    )
    await Mailer.sendEmail(
         patient.email,
        "Appointment Waitlisted",
        `Your appointment with Dr. ${doctor.name} has been waitlisted. We’ll notify you once a slot opens. Thank you!.`
    )
    res.status(200).json({ Title:"Added to Waitlist",
Message: "Appointment has been added to waitlist successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeFromWaitlistAndReady = async (req, res) => {
  try {
     const {id} = req.params;
     const doctorId=req.doctor.doctorID;
    
    // Find the appointment by ID
    const appointment = await Appointment.findOne(appointmentID: id);
    
   // Check if the appointment exists
    if (!appointment) {
      return res.status(404).json({ title: "Appointment not found",
message:"Appointment with the provided id not found"      });
    } });
    }

    if (appointment.doctor!==doctorId) {
      return res.status(401).json({title: "Unauthorized Access",
          message:
            "You are not authorised to waitlist this appointment. Please ensure that the appointment was booked with you" })
    }
    
    // Check if the patient is in the waitlist
    if (!appointment.waitlist || !appointment.waitlist.includes(patientId)) {
      return res.status(400).json({ title: "Patient not in waitlist",
        message:"Appoitment/Patient was not in waitlist" });
    }

    // Remove the patient from the waitlist
    appointment.waitlist = [];

    // Change the appointment status to "ready"
    appointment.status = "ready";

    // Save the updated appointment
    await appointment.save();
  const patient = await Patient.findOne({ patientID: appointment.patientId });
  
  //Notify patient that the appointment session now ready
await sendSMS(
    patient.phoneNumber,
    `Your appointment with Dr. ${doctor.name} is now confirmed and ready to start. Thank you!`    
     )
  
    await Mailer.sendEmail(
        patient.email,
        "Appointment Comfimed and Ready",
        `Your appointment with Dr. ${doctor.name} is now confirmed and ready to start. Thank you`    
         )
    res.status(200).json({
      Title:"Appointment Session Ready",
      Message: "Appointment session is now ready to begin with patient"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Future Feature:
//Display available slots
//exports.getAvailableSlots = async (req, res) => {
//  try {
 //   const { doctorId, date } = req.query;
 //   const slots = await Appointment.find({ doctor: doctorId, date, status: "available" });
  //  res.status(200).json(slots);
 // } catch (error) {
  //  res.status(500).json({ error: error.message });
 // }
//};
