const express = require("express");
//const morgan = require('morgan');
const connectDB = require("./config/database_config");

//Routes
const doctorRouter = require("./features/doctor/routes/doctor.route");
const patientRouter = require("./features/patient/routes/patient.route");
const appointmentRouter = require("./features/appointment/routes/appointment.route");
const threadRouter = require('./features/messaging/routes/thread.route');
const messagingRouter = require('./features/messaging/routes/messaging.route');
const subscriptionRouter = require("./features/plans/subscription/routes/subscription.route");
const paymentRouter = require("./features/plans/payments/routes/payment.route");
const transactionRouter = require("./features/plans/transaction/routes/transaction.route");

require("dotenv").config();
//app.use(morgan(':method :url :status :response-time ms'));
const app = express();
app.use(express.json());

//endpoints
app.use("/api/v1/doc-on-backend/payment", paymentRouter);
app.use("/api/v1/doc-on-backend/transaction", transactionRouter);
app.use("/api/v1/doc-on-backend/doctor", doctorRouter);
app.use("/api/v1/doc-on-backend/patient", patientRouter);
app.use("/api/v1/doc-on-backend/subscription_plans", subscriptionRouter);
app.use("/api/v1/doc-on-backend/appointment", appointmentRouter);
app.use('/api/v1/doc-on-backend/threads', threadRouter);
app.use('/api/v1/doc-on-backend/messages', messagingRouter);
const port = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is now live on PORT: ${port}`);
    });
  })
  .catch((e) => {
    console.log(`${e}`);
  });
