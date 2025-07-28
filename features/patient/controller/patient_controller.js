const Patient = require("../model/patient.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4 } = require("uuid");
const Mailer = require("../../../config/mailer_config");

const registerPatient = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      otherNames,
      email,
      phoneNumber,
      dateOfBirth,
      gender,
      password,
    } = req.body;
    const patient = await Patient.findOne({ email: email });
    if (patient) {
      res.status(400).json({
        title: "Email Already Exists",
        message:
          "The email you are trying to use is already in use by another user",
      });
    } else {
      const phoneNo = await Patient.findOne({ phoneNumber: phoneNumber });
      if (phoneNo) {
        res.status(400).json({
          title: "Phone Number Already Exists",
          message:
            "The phone number you trying to use is already in use by another user",
        });
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        const newPatient = new Patient({
          patientID: v4(),
          firstName,
          lastName,
          otherNames,
          email,
          phoneNumber,
          dateOfBirth,
          gender,
          password: hashPassword,
        });
        const savePatient = await newPatient.save();
        if (savePatient) {
          const accessToken = jwt.sign(
          {
            patient: {
              patientID: patient.patientID,
              firstName: patient.firstName,
              lastName: patient.lastName,
              email: patient.email,
              phoneNumber: patient.phoneNumber,
              role:patient.role,
            },
          },
          process.env.DOC_ON_PATIENT_KEY,
          { expiresIn: "30d" }
        );
          
          res.status(201).json({
            title: "Patient Registered Successfully",
            token:accessToken
               });
        } else {
          res.status(400).json({
            title: "Patient Registration Failed",
            message:
              "Sorry, we are unable to register this patient, please check the details and try again",
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

const patientLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const patient = await Patient.findOne({ email: email });
    if (!patient) {
      res.status(404).json({
        title: "Email Not Found",
        message:
          "The email you provided is not registered with us, please check the email and try again.",
      });
    } else {
      const isPassword = await bcrypt.compare(password, patient.password);
      if (!isPassword) {
        res.status(400).json({
          title: "Wrong Password",
          message:
            "The password you provided is incorrect, please check the password and try again.",
        });
      } else {
        const accessToken = jwt.sign(
          {
            patient: {
              patientID: patient.patientID,
              email: patient.email,
              hasSubscription:patient.hasSubscription,
              phoneNumber: patient.phoneNumber,
            },
          },
          process.env.DOC_ON_PATIENT_KEY,
          { expiresIn: "30d" }
        );
        res.status(200).json({
          title: "Login Successful",
          user: {accessToken, ...patient._doc},
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

const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const patient = await Patient.findOne({ patientID: req.patient.patientID });
    if (!patient) {
      res.status(404).json({
        title: "Patient Login Required",
        message: "You have to be logged in before you can update your password",
      });
    } else {
      const isOldPassword = await bcrypt.compare(oldPassword, patient.password);
      if (!isOldPassword) {
        res.status(400).json({
          title: "Wrong Old Password",
          message:
            "The old password you provided for us is incorrect, please check the password and try again or better still go for a forget password to get it all fixed",
        });
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashNewPassword = await bcrypt.hash(newPassword, salt);
        const updatePatientPassword = await Patient.findOneAndUpdate(
          {
            patientID: patient.patientID,
          },
          { password: hashNewPassword }
        );
        if (!updatePatientPassword) {
          res.status(500).json({
            title: "Password Update Failed",
            message:
              "Sorry, but we are unable to update your password at the moment, please try again later thank you",
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

const updatePatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      patientID: req.patient.patientID,
    });

    if (!patient) {
      res.status(404).json({
        title: "Profile Update Failed",
        message: "Doctor not found.",
      });
    } else {
      const {
        firstName,
        lastName,
        otherNames,
        gender,
        email,
        phoneNumber,
        contactInformation,
        dateOfBirth,
      } = req.body;

      const updatedPatient = await Patient.findOneAndUpdate(
        { patientID: patient.patientID },
        {
          firstName: firstName || patient.firstName,
          lastName: lastName || patient.lastName,
          otherNames: otherNames || patient.otherNames,
          gender: gender || patient.gender,
          email: email || patient.email,
          phoneNumber: phoneNumber || patient.phoneNumber,
          dateOfBirth: dateOfBirth || patient.dateOfBirth,
          contactInformation: contactInformation || patient.contactInformation,
        },
        { new: true }
      ).select("-password");
      if (!updatedPatient) {
        res.status(400).json({
          title: "Profile Update Failed",
          message:
            "Sorry, we were unable to update your profile at this time. Please try again later.",
        });
      } else {
        res.status(200).json({
          title: "DOC-ON Patient Update Profile",
          successful: true,
          message: "You have successfully updated your profile.",
          updatedPatient,
        });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${error.message}`,
    });
  }
};

const myProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientID: req.patient.patientID })
    .select("-password");

    if (!patient) {
      res.status(404).json({
        title: "Patient Not Found",
        message: "The patient profile you are looking for deos not exist",
      });
    } else {
      res.status(200).json({
        title: "Success",
        profileData: patient,
      });
    }
  } catch (e) {
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${e}`,
    });
  }
};

const patientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientID: req.params.patientID })
    .select("-password");

    if (!patient) {
      res.status(404).json({
        title: "Patient Not Found",
        message: "The patient profile you are looking for deos not exist",
      });
    } else {
      res.status(200).json({
        title: "Success",
        profileData: patient,
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
    const isRegisteredEmail = await Patient.findOne({ email: email });
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
    const patient = await Patient.findOne({ email: email });
    if (patient.otpCode !== otp) {
      res.status(400).json({
        title: "Invalid OTP",
        message:
          "The OTP you provided is does not match the one we sent you, please check your email and try again",
      });
    } else {
      if (patient.otpExpires < Date.now()) {
        res.status(400).json({
          title: "Expired OTP",
          message:
            "The OTP you provided us has expired, please request for another OTP",
        });
      } else {
        const salt = await bcrypt.genSalt(10);
        const encryptPassword = await bcrypt.hash(newPassword, salt);
        patient.password = encryptPassword;
        patient.otpCode = undefined;
        patient.otpExpires = undefined;
        const updatePassword = await patient.save();
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
    const isRegisteredEmail = await Patient.findOne({ email: email });
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
    const patient = await Patient.findOne({ email: email });
    if (patient.otpCode !== otp) {
      res.status(400).json({
        title: "Invalid OTP",
        message:
          "The OTP you provided is does not match the one we sent you, please check your email and try again",
      });
    } else {
      if (patient.otpExpires < Date.now()) {
        res.status(400).json({
          title: "Expired OTP",
          message:
            "The OTP you provided us has expired, please request for another OTP",
        });
      } else {
        patient.isEmailVerified = true;
        patient.otpCode = undefined;
        patient.otpExpires = undefined;
        const isSuccessful = await patient.save();
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


//ADMIN CONTROLLERS
// Get all Patients
const getAllPatients = async (req, res) => {
  try {
    let queryData = { ...req.query };

    const patients = await Patient.find(queryData);

    if (!patients || patients.length === 0) {
      return res.status(404).json({ message: "No Patients Found" });
    }
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Patient
const deletePatient = async (req, res) => {
  try {
    const { patientID } = req.params;
    if (!patientID) {
      return res.status(400).json({ message: "Invalid Or No ID Provided" });
    }
    const patient = await Patient.findOneAndDelete({
      patientID: patientID,
    });
    if (patient) {
      return res
        .status(200)
        .json({ success: true, message: "Patient Deleted" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Patient Not Found!" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Unable to delete" });
  }
};

//Patient Statistics
const getStatistics = async (req, res) => {
  try {
    const allPatients = await Patient.countDocuments();
    const subscribedPatients = await Patient.countDocuments({ hasSubscription: true });
    const nonSubscribedPatients=Number(allPatients)-Number(subscribedPatients)
    
    //console.log(allPatients, subscribedPatients, nonSubscribedPatients )
    if (typeof allPatients !== "number" || typeof subscribedPatients !=="number") {
      return res.status(404).json({ message: "Unable to fetch Patient statistics." });
    }
    res.status(200).json({allPatients, subscribedPatients, nonSubscribedPatients});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




module.exports = {
  registerPatient,
  patientLogin,
  updatePassword,
  myProfile,
  patientProfile,
  updatePatientProfile,
  forgotPassword,
  verifyResetPasswordOTPAndResetPassword,
  verifyAccountEmail,
  verifyEmailAddressWithOTP,
  
  //admin controllers
  getAllPatients,
  deletePatient,
  getStatistics
};
