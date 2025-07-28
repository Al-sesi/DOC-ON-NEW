const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.DB_URL);

    if (connect) {
      console.log("Database connected Successfully");
    } else {
      console.log("Unable to connect to database");
    }
  } catch (e) {
    console.log(`Something went wrong ${e}`);
  }
};

module.exports = {connectDB, mongoose};
