let doctorModel = require("../model/doctor.model");
let jwt = require("jsonwebtoken");
const { v4 } = require("uuid");
const bcrypt = require("bcryptjs");
const Mailer = require("../../../config/mailer_config");

const registerDoctor = async (req, res) => {
  try {
    const {
      title,
      firstName,
      lastName,
      specialty,
      medicalLicenseNumber,
      yearsOfExperience,
      gender,
      email,
      phoneNumber,
      password,
    } = req.body;
    const doctor = await doctorModel.findOne({ email: email });
    if (doctor) {
      res.status(400).json({
        title: "Email already exists",
        message:
          "The email you are trying to use has already been used by another doctor",
      });
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newDoctor = new doctorModel({
        docOnID: v4(),
        title,
        firstName,
        lastName,
        specialty,
        medicalLicenseNumber,
        yearsOfExperience,
        gender,
        email,
        phoneNumber,
        password: hashedPassword,
      });
      const saveDoctor = await newDoctor.save();
      if (saveDoctor) {
        res.status(201).json({
          title: "Doctor Registered Successfully",
          message: "You have successfully registered an account with us",
        });
      } else {
        res.status(400).json({
          title: "Doctor Registration Failed",
          message:
            "Sorry, we could not proccess this action, please try again later. Thank You",
        });
      }
    }
  } catch (e) {
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${e}`,
    });
  }
};

const signInDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await doctorModel.findOne({ email: email });
    if (!doctor) {
      res.status(404).json({
        title: "Email Not Found",
        message:
          "The email you provided us does not exist, please check the email and try again. Thank You",
      });
    } else {
      const isPassword = await bcrypt.compare(password, doctor.password);
      if (!isPassword) {
        res.status(400).json({
          title: "Wrong Password",
          message:
            "The password you provided is incorrect, please check the password and try again. Thank You",
        });
      } else {
        const accessToken = jwt.sign(
          {
            doctor: {
              docOnID: doctor.docOnID,
              title: doctor.title,
              firstName: doctor.firstName,
              lastName: doctor.lastName,
              email: doctor.email,
            },
          },
          process.env.DOC_ON_DOCTOR_KEY,
          { expiresIn: "30d" }
        );
        res.status(200).json({
          title: "Login Successful",
          doctor: { accessToken, ...doctor._doc },
        });
      }
    }
  } catch (e) {
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${e}`,
    });
  }
};

//update profile
const updateDoctorProfile = async (req, res) => {
  try {
    // Fetch the existing doctor by docOnID
    const doctor = await doctorModel.findOne({
      docOnID: req.doctor.docOnID,
    });

    if (!doctor) {
      return res.status(404).json({
        title: "Profile Update Failed",
        message: "Doctor not found.",
      });
    }

    // Destructure fields from the request body
    const {
      title,
      firstName,
      lastName,
      specialty,
      medicalLicenseNumber,
      yearsOfExperience,
      gender,
      email,
      phoneNumber,
      contactInformation,
      credentials,
      verification,
    } = req.body;

    // Update doctor fields with provided values or retain existing ones
    const updatedDoctor = await doctorModel.findOneAndUpdate(
      { docOnID: doctor.docOnID },
      {
        title: title || doctor.title,
        firstName: firstName || doctor.firstName,
        lastName: lastName || doctor.lastName,
        specialty: specialty || doctor.specialty,
        medicalLicenseNumber:
          medicalLicenseNumber || doctor.medicalLicenseNumber,
        yearsOfExperience: yearsOfExperience || doctor.yearsOfExperience,
        gender: gender || doctor.gender,
        email: email || doctor.email,
        phoneNumber: phoneNumber || doctor.phoneNumber,
        contactInformation: contactInformation || doctor.contactInformation,
        credentials: credentials || doctor.credentials,
        verification: verification || doctor.verification,
      },
      { new: true }
    );

    // If the doctor was not updated, respond accordingly
    if (!updatedDoctor) {
      return res.status(400).json({
        title: "Profile Update Failed",
        message:
          "Sorry, we were unable to update your profile at this time. Please try again later.",
      });
    }

    // Respond with success and updated profile
    res.status(200).json({
      title: "DOC-ON Doctor Update Profile",
      status: 200,
      successful: true,
      message: "You have successfully updated your profile.",
      updatedDoctor,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${error.message}`,
    });
  }
};

const doctorProfile = async (req, res) => {
  try {
    const doctor = await doctorModel.findOne({ docOnID: req.doctor.docOnID }).select("-password");

    if (!doctor) {
      res.status(404).json({
        title: "Doctor Not Found",
        message: "The doctor profile you are looking for deos not exist",
      });
    } else {
      res.status(200).json({
        title: "Success",
        profileData: doctor,
      });
    }
  } catch (e) {
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${e}`,
    });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const doctor = await doctorModel.findOne({ docOnID: req.doctor.docOnID });
    if (!doctor) {
      res.status(404).json({
        title: "Doctor Not Found",
        message:
          "Please make sure you are logged in as a doctor before you can be able to perfom this action",
      });
    } else {
      const isOldPassword = await bcrypt.compare(oldPassword, doctor.password);
      if (!isOldPassword) {
        res.status(400).json({
          title: "Wrong Old Password",
          message:
            "Please make sure you provide us with you actual previouse password",
        });
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashNewPassword = await bcrypt.hash(newPassword, salt);
        const updateDocPassword = doctorModel.findOneAndUpdate(
          { docOnID: doctor.docOnID },
          { password: hashNewPassword }
        );
        if (!updateDocPassword) {
          res.status(400).json({
            title: "Password Update Failed",
            message:
              "Sorry, but we are unable to update your password at the moment, please try again later. Thank You",
          });
        } else {
          res.status(200).json({
            title: "Password Updated Successfully",
            message: "You have successfully updated your password",
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

//reset user password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const isRegisteredEmail = await doctorModel.findOne({ email: email });
    if (!isRegisteredEmail) {
      res.status(400).json({
        title: "Email Does Not Exist",
        message: "The email you provided does not exist",
      });
    } else {
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Set code expiration time (2 minutes)
      const resetExpires = Date.now() + 2 * 60 * 1000;
      isRegisteredEmail.otpCode = resetCode;
      isRegisteredEmail.otpExpires = resetExpires;
      await isRegisteredEmail.save();

      await Mailer.sendEmail(
        email,
        "Forgot Password OTP",
        `Hello ${isRegisteredEmail.firstName.trim()} ${isRegisteredEmail.lastName.trim()} ${isRegisteredEmail.otherNames.trim()}, your ODC-ON reset password OTP is: \"${resetCode}\ and it will expire in 2 minutes"`
      );
      res.status(200).json({
        title: "OTP Sent",
        message: "A 6 digit OTP code has been sent to your email",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${e}`,
    });
  }
};

const verifyResetPasswordOTPAndResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const doctor = await doctorModel.findOne({ email: email });
    if (doctor.otpCode !== otp) {
      res.status(400).json({
        title: "Invalid OTP",
        message:
          "The OTP you provided is does not match the one we sent you, please check your email and try again",
      });
    } else {
      if (doctor.otpExpires < Date.now()) {
        res.status(400).json({
          title: "Expired OTP",
          message:
            "The OTP you provided us has expired, please request for another OTP",
        });
      } else {
        const salt = await bcrypt.genSalt(10);
        const encryptPassword = await bcrypt.hash(newPassword, salt);
        doctor.password = encryptPassword;
        doctor.otpCode = undefined;
        doctor.otpExpires = undefined;
        const updatePassword = await doctor.save();
        if (updatePassword) {
          res.status(200).json({
            title: "Password Chaneged Successfully",
            message:
              "You have successfully changed your password, you can now go and login",
          });
        } else {
          res.status(200).json({
            title: "Unable To Change Password",
            message:
              "Sorry we are unable to change your password at the moment, please try again later thank you.",
          });
        }
      }
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${e}`,
    });
  }
};

//verify email
const verifyAccountEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const isRegisteredEmail = await doctorModel.findOne({ email: email });
    if (!isRegisteredEmail) {
      res.status(400).json({
        title: "Email Does Not Exist",
        message: "The email you provided does not exist",
      });
    } else {
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      const verificationCodeExpires = Date.now() + 2 * 60 * 1000;
      isRegisteredEmail.otpCode = verificationCode;
      isRegisteredEmail.otpExpires = verificationCodeExpires;
      await isRegisteredEmail.save();

      Mailer.sendEmail(
        email,
        "Account Email Verification",
        `Hello ${isRegisteredEmail.firstName.trim()} ${isRegisteredEmail.lastName.trim()} ${isRegisteredEmail.otherNames.trim()}, your DOC-ON account email verification code is: \"${verificationCode}\" and it will expire in 2 minutes.`
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

const verifyEmailAddressWithOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const doctor = await doctorModel.findOne({ email: email });
    if (doctor.otpCode !== otp) {
      res.status(400).json({
        title: "Invalid OTP",
        message:
          "The OTP you provided is does not match the one we sent you, please check your email and try again",
      });
    } else {
      if (doctor.otpExpires < Date.now()) {
        res.status(400).json({
          title: "Expired OTP",
          message:
            "The OTP you provided us has expired, please request for another OTP",
        });
      } else {
        doctor.isEmailVerified = true;
        doctor.otpCode = undefined;
        doctor.otpExpires = undefined;
        const isSuccessful = await doctor.save();
        if (isSuccessful) {
          res.status(200).json({
            title: "Email Verified Successfully",
            message:
              "You have successfully verified your email address and also increased your account security",
          });
        } else {
          res.status(200).json({
            title: "Unable To Verify Your Email",
            message:
              "Sorry we are unable to verify your email at the moment, please try again later thank you.",
          });
        }
      }
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${e}`,
    });
  }
};

module.exports = {
  registerDoctor,
  signInDoctor,
  updateDoctorProfile,
  doctorProfile,
  updatePassword,
  forgotPassword,
  verifyResetPasswordOTPAndResetPassword,
  verifyAccountEmail,
  verifyEmailAddressWithOTP,
};
