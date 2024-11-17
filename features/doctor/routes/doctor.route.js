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
} = require("../controllers/doctor.controller");

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new doctor
 *     description: Register a doctor with professional, contact, credentials, and security information.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               specialty:
 *                 type: string
 *               medicalLicenseNumber:
 *                 type: string
 *               yearsOfExperience:
 *                 type: string
 *               gender:
 *                 type: string
 *               address:
 *                 type: string
 *               preferredLanguage:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               medicalLicense:
 *                 type: string
 *                 format: binary
 *               idProof:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Doctor registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Registration failed due to validation error
 */
router.post(
  "/register",
  upload.fields([{ name: "medicalLicense" }, { name: "idProof" }]),
  registerDoctor
);
router.post("/login", signInDoctor);

module.exports = router;
