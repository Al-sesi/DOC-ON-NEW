// List of imports
const express = require("express");
const mongoose = require("mongoose");
const app = express();
require("dotenv").config();
let doctorRouter = require("./routes/doctor.route");
let patientRouter = require("./routes/patient.route");
const cors = require("cors");
const doctorModel = require("./models/doctor.model");
const patientModel = require("./models/patient.model");
const multer = require("multer");
const path = require("path");
const { swaggerUi, swaggerSpec } = require("./swagger");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Middleware
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/doctor", doctorRouter);
app.use("/patient", patientRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Variable Declarations
let PORT = process.env.PORT;
let URI = process.env.URI;

mongoose
  .connect(URI)
  .then(() => {
    console.log("mongodb success");
  })
  .catch((err) => {
    console.log(err);
    console.log("error encountered");
  });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
