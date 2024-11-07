let doctorModel = require("../models/doctor.model");
const multer = require("multer");
const fs = require("fs");
let jwt = require("jsonwebtoken");
let nodemailer = require("nodemailer");
const path = require("path");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const registerDoctor = (req, res) => {
 
  const { medicalLicense, idProof } = req.files;

  const doctorData = {
    ...req.body,
    security: [{ password: req.body.password }], 
    verification: {
      medicalLicense: medicalLicense[0].path,
      idProof: idProof[0].path,
    },
    professionalInformation: {
      title: req.body.title,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      specialty: req.body.specialty,
      medicalLicenseNumber: req.body.medicalLicenseNumber,
      yearsOfExperience: req.body.yearsOfExperience,
      gender: req.body.gender,
    },
    credentials: {
      medicalDegree: req.body.medicalDegree,
      boardCertification: req.body.boardCertification,
    },
    contactInformation: {
      address: req.body.address,
      preferredLanguage: req.body.preferredLanguage,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
    },
  };

  const form = new doctorModel(doctorData);
  form
    .save()
    .then(() => {
      const token = jwt.sign({ email: doctorData.email }, process.env.SECRET, {
        expiresIn: "7h",
      });
      res.send({ status: true, message: "Sign up was successful", token });
    })
    .catch((err) => {
      console.error("Error saving:", err);
      res.send({ status: false, message: "Sign up was not successful" });
    });
};

const signInDoctor = (req, res) => {
  const { email, password } = req.body;

  doctorModel
    .findOne({ "contactInformation.email": email }) 
    .then((user) => {
      if (!user) {
        res.send({ status: false, message: "User does not exist" });
      } else {
        user.validatePassword(password, (err, same) => {
          if (err) {
            return res.send({
              status: false,
              message: "Error in password validation",
            });
          }
          if (!same) {
            return res.send({ status: false, message: "Wrong credentials" });
          }
          const secret = process.env.SECRET;
          const token = jwt.sign({ email }, secret, { expiresIn: "7h" });
          res.send({ status: true, message: "Welcome", token });
        });
      }
    })
    .catch((err) => {
      console.error("Error during sign-in:", err);
      res.send({ status: false, message: "Sign-in failed" });
    });
};

module.exports = {
  registerDoctor,
  signInDoctor,
};
