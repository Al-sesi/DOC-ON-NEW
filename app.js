const express = require("express");
const connectDB = require("./config/database_config");
const doctorRouter = require("./features/doctor/routes/doctor.route");
require("dotenv").config();

const app = express();
app.use(express.json());

//endpoints
app.use("/api/v1/doc-on-backend/doctor", doctorRouter);

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is now live on PORT: ${port}`);
    });
  })
  .catch((e) => {
    console.log(`e`);
  });
