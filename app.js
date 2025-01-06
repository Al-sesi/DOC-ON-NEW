const express = require("express");
const connectDB = require("./config/database_config");
const doctorRouter = require("./features/doctor/routes/doctor.route");
const patientRouter = require("./features/patient/routes/patient.route");
const appointmentRouter = require("./features/appointment/routes/appointment.routes");

require("dotenv").config();

const app = express();
app.use(express.json());

//endpoints
app.use("/api/v1/doc-on-backend/doctor", doctorRouter);
app.use("/api/v1/doc-on-backend/patient", patientRouter);
app.use("/api/v1/doc-on-backend/appointment", appointmentRouter);

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is now live on PORT: ${port}`);
    });
  })
  .catch((e) => {
    console.log(`${e}`);
  });
