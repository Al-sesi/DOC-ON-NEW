const router = require("express").Router();
const adminController = require("../controller/admin_controller");
const adminAccessTokenValidator = require("../../middleware/admin_access_token_validator");

router.post("/register", adminAccessTokenValidator, adminController.registerAdmin);
router.post("/login", adminController.adminLogin);
router.post("/forgot-password", adminController.forgotPassword);

router.post(
  "/reset-password",
  adminController.verifyResetPasswordOTPAndResetPassword
);

router.put(
  "/update-password",
  adminAccessTokenValidator,
  adminController.updatePassword
);

router.put(
  "/update-profile",
  adminAccessTokenValidator,
  adminController.updateAdminProfile
);
router.get(
  "/profile",
  adminAccessTokenValidator,
  adminController.adminProfile
);

module.exports = router;
