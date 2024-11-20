const router = require("express").Router();
const DoctorController = require("../controller/doctor_controller");
const doctorAccessTokenValidator = require("../../../middleware/doctor_access_token_validator");

router.post("/register", DoctorController.registerDoctor);
router.post("/login", DoctorController.signInDoctor);
router.get(
  "/doctor-profile",
  doctorAccessTokenValidator,
  DoctorController.doctorProfile
);
router.put(
  "/update-profile",
  doctorAccessTokenValidator,
  DoctorController.updateDoctorProfile
);

module.exports = router;
