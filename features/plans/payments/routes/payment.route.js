const express = require("express");
const router = express.Router();
const doctorAccessTokenValidator = require("../../../../middleware/doctor_access_token_validator");
const patientAccessTokenValidator = require("../../../../middleware/patient_access_token_validator");

const {
  //payment,
  initializePatientPayment,
  initializeDoctorPayment,
  verifyPayment
} = require("../controller/payment.controller");

// Routes
//router.get("/", payment);
router.post("/patient/initialize", patientAccessTokenValidator, initializePatientPayment);
router.post("/doctor/initialize", doctorAccessTokenValidator, initializeDoctorPayment);
router.post("/verify", verifyPayment);

module.exports = router;
