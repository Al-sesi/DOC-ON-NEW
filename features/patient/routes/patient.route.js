const router = require("express").Router();
const PatientController = require("../controller/patient_controller");
const patientAccessTokenValidator = require("../../../middleware/patient_access_token_validator");

router.post("/register", PatientController.registerPatient);
router.post("/login", PatientController.patientLogin);
router.put(
  "/update-password",
  patientAccessTokenValidator,
  PatientController.updatePassword
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
