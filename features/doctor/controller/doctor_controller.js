let doctorModel = require("../model/doctor.model");
let jwt = require("jsonwebtoken");
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
    }
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
  } catch (e) {
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${e}`,
    });
  }
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
