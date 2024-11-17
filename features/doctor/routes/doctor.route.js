// List of imports
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const {
  registerDoctor,
  signInDoctor,
  sendMail,
} = require("../controller/doctor.controller");

router.post(
  "/register",
  upload.fields([{ name: "medicalLicense" }, { name: "idProof" }]),
  registerDoctor
);
router.post("/login", signInDoctor);

module.exports = router;
