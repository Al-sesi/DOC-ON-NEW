let patientModel = require("../models/patient.model");
let jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
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

const registerPatient = (req, res) => {
  console.log(req.body);
  console.log(req.file); 
  const idProof = req.file; 

  const patientData = {
    ...req.body,
    security: [{ password: req.body.password }],
    verification: {
      idProof: idProof ? idProof.path : null, 
    },
    personalInformation: {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      gender: req.body.gender,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      dateOfBirth: req.body.dateOfBirth,
    },
    contactInformation: {
      address: req.body.address,
      preferredLanguage: req.body.preferredLanguage,
    },
  };

  let form = new patientModel(patientData);
  form
    .save()
    .then(() => {
      console.log("Saved Successfully");
      const token = jwt.sign({ email: patientData.email }, process.env.SECRET, {
        expiresIn: "7h",
      });

      res.send({ status: true, message: "Sign up was successful", token });
    })
    .catch((err) => {
      console.log("Error Saving");
      console.log(err);
      res.send({ status: false, message: "Sign up was not successful" });
    });
};

const signInPatient = (req, res) => {
  console.log(req.body);
  let { email, password } = req.body;
  patientModel
    .findOne({ "personalInformation.email": email })
    .then((user) => {
      console.log(user);
      if (!user) {
        res.send({ status: false, message: "Does not exist" });
      } else {
        let secret = process.env.SECRET;
        user.validatePassword(password, (err, same) => {
          if (!same) {
            res.send({ status: false, message: "wrong credentials" });
          } else {
            let token = jwt.sign({ email }, secret, { expiresIn: "7h" });
            console.log(token);
            res.send({ status: true, message: "Welcome", token });
          }
        });
        console.log("Signin successful");
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = {
  registerPatient,
  signInPatient,
};
