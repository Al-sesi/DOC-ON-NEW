const express = require("express");
const connectDB = require("./config/database_config");
require("dotenv").config();

const app = express();
app.use(express.json());

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
