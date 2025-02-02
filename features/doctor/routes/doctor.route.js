const router = require("express").Router();
const DoctorController = require("../controller/doctor_controller");
const doctorAccessTokenValidator = require("../../../middleware/doctor_access_token_validator");
const adminAccessTokenValidator = require("../../../middleware/admin_access_token_validator");

router.post("/register", DoctorController.registerDoctor);
router.post("/login", DoctorController.signInDoctor);
router.get(
  "/my-profile",
  doctorAccessTokenValidator,
  DoctorController.myProfile
);

router.get(
  "/doctor-profile",
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

router.get(
  "/",
  adminAccessTokenValidator,
  DoctorController.getAllDoctors
);

router.get(
  "/admin/statistics",
  adminAccessTokenValidator,
  DoctorController.getStatistics
);

router.delete(
  "/:doctorID",
  adminAccessTokenValidator,
  DoctorController.deleteDoctor
);
module.exports = router;
