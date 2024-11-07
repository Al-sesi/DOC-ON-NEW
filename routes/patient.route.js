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
  registerPatient,
  signInPatient,
} = require("../controllers/patient.controller");

// Routes
router.post("/register", upload.single("idProof"), registerPatient);
router.post("/login", signInPatient);

module.exports = router;
