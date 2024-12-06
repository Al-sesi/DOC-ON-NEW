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
router.put(
  "/update-password",
  doctorAccessTokenValidator,
  DoctorController.updatePassword
);

router.post("/forgot-password", DoctorController.forgotPassword);
router.post(
  "/reset-password",
  DoctorController.verifyResetPasswordOTPAndResetPassword
);

router.post(
  "/send-email-otp",
  doctorAccessTokenValidator,
  DoctorController.verifyAccountEmail
);
router.post(
  "/verify-email-otp",
  doctorAccessTokenValidator,
  DoctorController.verifyEmailAddressWithOTP
);

module.exports = router;
