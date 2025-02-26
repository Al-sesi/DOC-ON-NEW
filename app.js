const express = require("express");
const http = require("http");
const { connectDB } = require("./config/database_config");
const { initializeSocket } = require("./config/socket_config");
const {watchMan}=require("./watchMan/watchman");

//Check transaction expiry date and update associate profile
watchMan();

require("dotenv").config();

// Routes
const doctorRouter = require("./features/doctor/routes/doctor.route");
const patientRouter = require("./features/patient/routes/patient.route");
const appointmentRouter = require("./features/appointment/routes/appointment.route");
const chatRouter = require("./features/chat/routes/chat.route");
const subscriptionRouter = require("./features/plans/subscription/routes/subscription.route");
const paymentRouter = require("./features/plans/payments/routes/payment.route");
const transactionRouter = require("./features/plans/transaction/routes/transaction.route");
const adminRouter = require("./admin/routes/admin.route");

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use("/uploads", express.static("uploads")); // Static files

// Endpoints
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/transaction", transactionRouter);
app.use("/api/v1/doctor", doctorRouter);
app.use("/api/v1/patient", patientRouter);
app.use("/api/v1/subscription_plans", subscriptionRouter);
app.use("/api/v1/appointment", appointmentRouter);
app.use("/api/v1/admin", adminRouter);

// Initialize Socket.IO only when the chat router is accessed
app.use("/api/v1/chat", (req, res, next) => {
    if (!req.ioInitialized) {
        initializeSocket(server); // Initialize Socket.IO
        req.ioInitialized = true; // Prevent multiple initializations
    }
    next();
}, chatRouter);

// Server startup
const port = process.env.PORT || 3000;

connectDB()
    .then(() => {
        server.listen(port, () => {
            console.log(`Server is live on PORT: ${port}`);
        });
    })
    .catch((e) => {
        console.log(`Database connection error: ${e.message}`);
    });
