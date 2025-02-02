const express = require("express");
const {
  //getAvailableSlots,
  allAppointments,
  getAppointmentById,
  searchAppointments,
  bookAppointment,
  addToWaitlist,
  removeFromWaitlistAndReady,
  getStatistics
} = require("../controller/appointment_controller");

const doctorAccessTokenValidator = require("../../../middleware/doctor_access_token_validator");
const patientAccessTokenValidator = require("../../../middleware/patient_access_token_validator");
const adminAccessTokenValidator = require("../../../middleware/admin_access_token_validator");

const router = express.Router();

//router.get("/slots", getAvailableSlots);
router.get("/", allAppointments);
router.get("/search", searchAppointments);
router.post("/book", patientAccessTokenValidator, bookAppointment );
router.get("/:id", getAppointmentById);
router.put("/waitlist/:id", doctorAccessTokenValidator, addToWaitlist);
router.put("/makeready/:id", doctorAccessTokenValidator, removeFromWaitlistAndReady)
router.get("/admin/get/statistics", adminAccessTokenValidator, getStatistics);

module.exports = router;


