const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  appointmentID: {
      type: String,
    },
  date: {type:String, required:true},
  time: {type:String, required:true},
  doctorDetails: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "doctors", 
    required: true,
  },
  patientDetails: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "patients",  
    required: true,
  },
  specialty:{type:String, required:true},
  status: { type: String, default: "available" },
  telehealthLink:{type: String},
  telehealthAccess:String  
});

module.exports = mongoose.model("Appointment", appointmentSchema);


