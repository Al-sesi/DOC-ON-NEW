const router = require("express").Router();
const PatientController = require("../controller/patient_controller");
const patientAccessTokenValidator = require("../../../middleware/patient_access_token_validator");

router.post("/register", PatientController.registerPatient);
router.post("/login", PatientController.patientLogin);
router.post("/forgot-password", PatientController.forgotPassword);
router.post(
  "/reset-password",
  PatientController.verifyResetPasswordOTPAndResetPassword
);
router.put(
  "/update-password",
  patientAccessTokenValidator,
  PatientController.updatePassword
);
router.post(
  "/send-email-otp",
  patientAccessTokenValidator,
  PatientController.verifyAccountEmail
);
router.post(
  "/verify-email-otp",
  patientAccessTokenValidator,
  PatientController.verifyEmailAddressWithOTP
);
router.put(
  "/update-profile",
  patientAccessTokenValidator,
  PatientController.updatePatientProfile
);
router.get(
  "/patient-profile",
  patientAccessTokenValidator,
  PatientController.patientProfile
);

module.exports = router;
