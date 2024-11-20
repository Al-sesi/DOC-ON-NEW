let doctorModel = require("../model/doctor.model");
let jwt = require("jsonwebtoken");
const { v4 } = require("uuid");
const bcrypt = require("bcryptjs");

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
      title: "Clodocs Doctor Update Profile",
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
    const doctor = await doctorModel.findOne({ docOnID: req.doctor.docOnID });

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

module.exports = {
  registerDoctor,
  signInDoctor,
  updateDoctorProfile,
  doctorProfile,
};
