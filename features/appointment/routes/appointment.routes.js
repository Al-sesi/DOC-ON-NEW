const express = require("express");
const appointmentController = require("../controller/appointment_controller");

const doctorAccessTokenValidator = require("../../../middleware/doctor_access_token_validator");
const patientAccessTokenValidator = require("../../../middleware/patient_access_token_validator");

const router = express.Router();

//router.get("/slots", getAvailableSlots);
router.get("/search", appointmentController.searchAppointments);
router.post(
  "/book",
  appointmentController.bookAppointment,
  patientAccessTokenValidator
);
router.post(
  "/waitlist",
  appointmentController.addToWaitlist,
  doctorAccessTokenValidator
);
router.post(
  "/makeready",
  appointmentController.removeFromWaitlistAndReady,
  doctorAccessTokenValidator
);
module.exports = router;
