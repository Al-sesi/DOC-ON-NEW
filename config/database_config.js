const mongoose = require("mongoose");
//const DB_URL = "mongodb+srv://doc_admin:doc1110101@cluster0.et17l.mongodb.net/doconDB?retryWrites=true&w=majority&appName=Cluster0"
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

module.exports = connectDB;
