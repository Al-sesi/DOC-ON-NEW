const Admin = require("../model/admin.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4 } = require("uuid");
const Mailer = require("../../config/mailer_config");

const registerAdmin = async (req, res) => {
  try {
        const mainAdmin = await Admin.findOne({
      adminID: req.admin.adminID,
    });

    if (!mainAdmin) {
      return res.status(404).json({
        title: "Unathorize Access",
        message: "Your profile is not found!.",
      });
    }
    
    if (mainAdmin.access!== "owner" ) {
      return res.status(404).json({
        title: "Unathorize Access",
        message: "You are not authorized to create this account. Sign in with proper credentials!.",
      });
    }
    
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
  } = req.body;

  // Check if email already exists
  const admin = await Admin.findOne({ email: email });
  if (admin) {
    return res.status(400).json({
      title: "Email Already Exists",
      message: "The email you are trying to use is already in use.",
    });
  }

  // Check if phone number already exists
  const phoneNo = await Admin.findOne({ phoneNumber: phoneNumber });
  if (phoneNo) {
    return res.status(400).json({
      title: "Phone Number Already Exists",
      message: "The phone number in use by another user",
    });
  }

  // Hash the password and create a new admin
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);
  const newAdmin = new Admin({
    adminID: v4(),
    firstName,
    lastName,
    email,
    phoneNumber,
    password: hashPassword,
  });

  const saveAdmin = await newAdmin.save();
  if (!saveAdmin) {
    return res.status(400).json({
      title: "Admin Registration Failed",
      message: "Sorry, we are unable to register this admin, please check the details and try again",
    });
  }

  res.status(201).json({
    title: "Admin Registered Successfully",
    message: "You have successfully registered to our services",
  });
} catch (e) {
  res.status(500).json({
    title: "Server Error",
    message: `Server Error: ${e.message}`,
  });
}
  };

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: email });
    if (!admin) {
     return res.status(404).json({
        title: "Email Not Found",
        message:
          "The email you provided is not registered with us, please check the email and try again.",
      });
    }
    
      const isPassword = await bcrypt.compare(password, admin.password);
      if (!isPassword) {
       return res.status(400).json({
          title: "Wrong Password",
          message:
            "The password you provided is incorrect, please check the password and try again.",
        });
      }
    
        const accessToken = jwt.sign(
          {
            admin: {
              adminID: admin.adminID,
              firstName: admin.firstName,
              lastName: admin.lastName,
              email: admin.email,
              role:admin.role,
              phoneNumber: admin.phoneNumber,
            },
          },
          process.env.DOC_ON_ADMIN_KEY,
          { expiresIn: "30d" }
        );
        res.status(200).json({
          title: "Login Successful",
          token: accessToken,
        });
  } catch (e) {
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${e}`
    });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const admin = await Admin.findOne({ adminID: req.admin.adminID });
    if (!admin) {
      res.status(404).json({
        title: "Admin Login Required",
        message: "You have to be logged in before you can update your password",
      });
    } else {
      const isOldPassword = await bcrypt.compare(oldPassword, admin.password);
      if (!isOldPassword) {
        res.status(400).json({
          title: "Wrong Old Password",
          message:
            "The old password you provided is incorrect, please check the password and try again or use the forget password to reset",
        });
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashNewPassword = await bcrypt.hash(newPassword, salt);
        const updateAdminPassword = await Admin.findOneAndUpdate(
          {
            adminID: admin.adminID,
          },
          { password: hashNewPassword }
        );
        if (!updateAdminPassword) {
          res.status(500).json({
            title: "Password Update Failed",
            message:
              "Sorry, unable to update your password at the moment, please try again later thank you",
          });
        } else {
          res.status(200).json({
            title: "Password Updated Successfully",
            message: "You have successfully updated your account password",
          });
        }
      }
    }
  } catch (e) {
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${e}`,
    });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findOne({
      adminID: req.admin.adminID,
    });

    if (!admin) {
      return res.status(404).json({
        title: "Profile Not Found",
        message: "Admin  profile not found.",
      });
    }
      const {
        firstName,
        lastName,
        email,
        phoneNumber,
      } = req.body;

      const updatedAdmin = await Admin.findOneAndUpdate(
        { adminID: admin.adminID },
        {
          firstName: firstName || admin.firstName,
          lastName: lastName || admin.lastName,
          email: email || admin.email,
          phoneNumber: phoneNumber || admin.phoneNumber,
        },
        { new: true }
      ).select("-_id -password");
    
      if (!updatedAdmin) {
        return res.status(400).json({
          title: "Profile Update Failed",
          message:
            "Sorry, we were unable to update your profile at this time. Please try again later.",
        });
      } 
        res.status(200).json({
          title: "Profile updated",
           updatedAdmin,
        });
  } catch (error) {
     //  console.error(error);
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${error.message}` });

   };
}
const adminProfile = async (req, res) => {
  try {
    const admin = await Admin.findOne({ adminID: req.admin.adminID })
    .select("-_id -password");;

    if (!admin) {
      res.status(404).json({
        title: "Admin Not Found",
        message: "The admin profile you are looking for deos not exist",
      });
    } else {
      res.status(200).json({
        title: "Success",
        profileData: admin,
      });
    }
  } catch (e) {
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${e}`,
    });
  }
};

//reset user password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    //console.log(email)
    const isRegisteredEmail = await Admin.findOne({ email: email });
    if (!isRegisteredEmail) {
      res.status(400).json({
        title: "Email Does Not Exist",
        message: "The email you provided does not exist",
      });
    } else {
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Set code expiration time (2 minutes)
      const resetExpires = Date.now() + 5 * 60 * 1000;
      
      isRegisteredEmail.otpCode = resetCode;
      isRegisteredEmail.otpExpires = resetExpires;
      
      await isRegisteredEmail.save();
      await Mailer.sendEmail(
        email,
        "Forgot Password OTP",
        `Hello ${isRegisteredEmail.firstName} ${isRegisteredEmail.lastName}, your DOC-ON reset password OTP is: \"${resetCode}\ and it will expire in 5 minutes"`
      );
      res.status(200).json({
        title: "OTP Sent",
        message: "A 6 digit OTP code has been sent to your email",
      });
    }
  } catch (e) {
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${e}`,
    });
  }
};

const verifyResetPasswordOTPAndResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const admin = await Admin.findOne({ email: email });
    //console.log(admin)
    if (admin.otpCode !== otp) {
    return  res.status(400).json({
        title: "Invalid OTP",
        message:
          "The OTP you provided does not match the one sent to you, please check your email and try again",
      });
    } 
      if (admin.otpExpires < Date.now()) {
      return  res.status(400).json({
          title: "Expired OTP",
          message:
            "The OTP you provided us has expired, please request for another OTP",
        });
      } 
        const salt = await bcrypt.genSalt(10);
        const encryptPassword = await bcrypt.hash(newPassword, salt);
        admin.password = encryptPassword;
        admin.otpCode = undefined;
        admin.otpExpires = undefined;
        const updatePassword = await admin.save();
        if (updatePassword) {
          res.status(200).json({
            title: "Password Chaneged Successfully",
            message:
              "You have successfully changed your password, you can now go and login",
          });
        } else {
          res.status(404).json({
            title: "Unable To Change Password",
            message:
              "Sorry we are unable to change your password at the moment, please try again later thank you.",
          });
        }
  }catch (e) {
    console.log(e);
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${e}`,
    });
  }
};

module.exports = {
  registerAdmin,
  adminLogin,
  updatePassword,
  adminProfile,
  updateAdminProfile,
  forgotPassword,
  verifyResetPasswordOTPAndResetPassword
};
