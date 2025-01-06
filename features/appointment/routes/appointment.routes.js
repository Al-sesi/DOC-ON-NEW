const express = require("express");
const {
  //getAvailableSlots,
  searchAppointments,
  bookAppointment,
  addToWaitlist,
  removeFromWaitlistAndReady
} = require("../controllers/appointment_controller");

const doctorAccessTokenValidator = require("../../../middleware/doctor_access_token_validator");
const patientAccessTokenValidator = require("../../../middleware/patient_access_token_validator");

const router = express.Router();

//router.get("/slots", getAvailableSlots);
router.get("/search", searchAppointments);
router.post("/book", bookAppointment, patientAccessTokenValidator );
router.post("/waitlist", addToWaitlist, doctorAccessTokenValidator);
router.post("/makeready", removeFromWaitlistAndReady, doctorAccessTokenValidator)
module.exports = router;


