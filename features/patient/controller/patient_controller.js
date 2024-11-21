const Patient = require("../model/patient.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4 } = require("uuid");

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
          res.status(201).json({
            title: "Patient Registered Successfully",
            message: "You have successfully registered to our services",
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
              firstName: patient.firstName,
              lastName: patient.lastName,
              email: patient.email,
              phoneNumber: patient.phoneNumber,
            },
          },
          process.env.DOC_ON_PATEINT_KEY,
          { expiresIn: "30d" }
        );
        res.status(200).json({
          title: "Login Successful",
          patient: { accessToken, ...patient._doc },
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
      );
      if (!updatedPatient) {
        res.status(400).json({
          title: "Profile Update Failed",
          message:
            "Sorry, we were unable to update your profile at this time. Please try again later.",
        });
      } else {
        res.status(200).json({
          title: "DOC-ON Patient Update Profile",
          status: 200,
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

const patientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientID: req.patient.patientID });

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

module.exports = {
  registerPatient,
  patientLogin,
  updatePassword,
  patientProfile,
  updatePatientProfile,
};
