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
    const patient = await Patient.findOne({ patientID: req.patient.patientID });
    if (!patient) {
      res.status(400).json({
        title: "Login Required",
        message: "You need to log in before accessing this route.",
      });
    } else {
      const filters = { status: "available" };
      if (date) {
        filters.date = date;
      } else if (time) {
        filters.time = time;
      } else if (specialty) {
        const doctor = await Doctor.findOne({ specialty });
        if (!doctor) {
          res.status(404).json({
            title: "Doctor Not Found",
            message: `No doctor found with specialty: ${specialty}`,
          });
        } else {
          filters.doctor = doctor.docOnID;
        }
      } else if (doctorId) {
        filters.doctor = doctorId;
      }
      const appointments = await Appointment.find(filters).populate("doctor");

      if (appointments.length === 0) {
        return res.status(404).json({
          title: "No Appointments Found",
          message: "No available appointments match your search criteria.",
        });
      } else {
        res.status(200).json(appointments);
      }
    }
  } catch (error) {
    res.status(500).json({
      title: "Server Error",
      message: error.message,
    });
  }
};

//Book new appointment
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, specialty } = req.body;
    const patient = await Patient.findOne({
      patientID: req.patient.patientID,
    });
    if (!patient) {
      res.status(400).json({
        title: "Login Required",
        message: "You are expected to login before proceeding",
      });
    } else {
      const doctor = await Doctor.findOne({ docOnID: doctorId });
      if (!doctor) {
        res.status(404).json({
          title: "Doctor Not Found",
          message: "The doctor you are booking on does not exit",
        });
      } else {
        if (!date || !time || !specialty) {
          res.status(400).json({
            title: "Fields Required",
            message: "All fields are required",
          });
        } else {
          const roomName = `appointment_${doctorId}_${Date.now()}`;
          const { telehealthLink } = await createTwilioRoomAndToken(
            roomName,
            patientName
          );
          const appointment = new Appointment({
            doctor: doctorId,
            patientId: patient.patientID,
            date,
            time,
            specialty,
            status: "booked",
            telehealthLink,
          });

          const saveAppointment = await appointment.save();

          if (!saveAppointment) {
            res.status(400).json({
              title: "Failed To Book Appointment",
              message:
                "Sorry, we are unable to book this appointment at the moment, please try again later. Thannk You",
            });
          } else {
            await sendEmail(
              doctor.email,
              "You Have New Appointment Scheduled",
              `<p>You have a new appointment with ${patient.phoneNumber} on ${date} at ${time}.</p>`
            );

            await Mailer.sendEmail(
              email,
              "Appointment Booked Successfully",
              `Your appointment with Dr. ${doctor.name} is confirmed for ${date} at ${time}.`
            );

            res.status(201).json({
              title: "Appointment Booked Successfully",
              message: "Appointment created successfully",
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ message: "Error booking appointment", error });
  }
};

// Waitlist management
const addToWaitlist = async (req, res) => {
  try {
    const { appointmentId, patientId } = req.body;
    const doctor = await Doctor.findOne({ docOnID: req.doctor.docOnID });
    if (!doctor) {
      res.status(404).json({
        title: "Login Required",
        message: "You are to login before accessing this",
      });
    } else {
      const appointment = await Appointment.findById(appointmentId);
      if (req.appointment.status !== "booked") {
        res.status(400).json({ error: "Appointment is not booked" });
      } else {
        if (appointment.doctor !== doctor.docOnID) {
          res.status(401).json({
            error:
              "Unauthorized access. Please make sure the appointment is booked with you",
          });
        } else {
          appointment.status = appointment.waitlist || [];
          appointment.waitlist.push(patientId);
          const saveProcess = await appointment.save();
          if (!saveProcess) {
            res.status(400).json({
              title: "Unable To Waitlist Appointment",
              message:
                "Sorry, but we are unable to waitlist this appointment at the moment, please try again later. Thank You",
            });
          } else {
            res.status(200).json({
              title: "Appointment Waitlisted",
              message: "You have successfully waitlisted this appointment",
            });
          }
        }
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeFromWaitlistAndReady = async (req, res) => {
  try {
    const { appointmentId, patientId } = req.body;
    const doctor = await Doctor.findOne({ docOnID: req.doctor.docOnID });
    const appointment = await Appointment.findById(appointmentId);
    if (appointment.doctor !== doctor.docOnID) {
      res.status(401).json({
        error:
          "Unauthorized access. Please make sure the appointment is booked with you",
      });
    } else {
      if (!appointment) {
        res.status(404).json({
          title: "Appointment Not Found",
          message: "The appoinment you are looking for does not exist",
        });
      } else {
        if (
          !appointment.waitlist ||
          !appointment.waitlist.includes(patientId)
        ) {
          res.status(400).json({
            title: "Not In Waitlist",
            message: "Patient not in waitlist",
          });
        } else {
          appointment.waitlist = appointment.waitlist.filter(
            (id) => id.toString() !== patientId
          );
          appointment.status = "ready";
          const removeFromWaitlist = await appointment.save();

          if (!removeFromWaitlist) {
            res.status(400).json({
              title: "Failed",
              message:
                "We are unable remove this appoinment from your waitlist",
            });
          } else {
            res.status(200).json({
              title: "Remove From Waitlit",
              message: "Appointment successfully removed from your waitlist",
            });
          }
        }
      }
    }
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
