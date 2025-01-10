const express = require("express");
const {
  //getAvailableSlots,
  getAppointmentById,
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
router.post("/:id", getAppointmentById);
router.put("/waitlist/:id", addToWaitlist, doctorAccessTokenValidator);
router.put("/makeready/:id", removeFromWaitlistAndReady, doctorAccessTokenValidator)
module.exports = router;
