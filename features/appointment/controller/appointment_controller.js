const { v4 } = require("uuid");
const Appointment = require("../model/appointment_model");
const Doctor = require("../../doctor/model/doctor.model");
const Patient = require("../../patient/model/patient.model");
const { sendSMS, createTwilioRoomAndToken } = require("../utils/appointment_utils");
const Mailer = require("../../../config/mailer_config");
const {BookingSlot}=require("../../plans/payments/model/booking.model")

// All appointments
exports.allAppointments= async (req, res) => {
  try {
    let queryData = { ...req.query };
    const appointments = await Appointment.find(queryData)
    .populate([{path:"doctorDetails", select:"-_id firstName lastName email docOnID specialty phoneNumber"},
    {path:"patientDetails", select:"-_id patientID firstName lastName email phoneNumber"}]).select("-telehealthAccess -telehealthLink");

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ message: "No Appointment Found" });
    }
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchAppointments = async (req, res) => {
  try {
    const { date, time, specialty, docOnID } = req.query;
    const filters = { status: "available" };
    if (date) filters.date = date;
    if (time) filters.time = time;
    if (specialty) {
      const doctor = await Doctor.findOne({ specialty });
      if (doctor) filters.doctor = doctor.docOnID;
    }
    if (docOnID) filters.doctor = docOnID;

    const appointments = await Appointment.find(filters)
     .populate([{path:"doctorDetails", select:"-_id firstName lastName email docOnID specialty phoneNumber"},
                {path:"patientDetails", select:"-_id patientID firstName lastName email phoneNumber"}]);

    if (!appointments.length) {
      return res.status(400).json({
        title: "Appointment Not Found",
        message: "No appointments match the provided filters. Please try again.",
      });
    }
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${error.message}`,
    });
  }
};

// Book a new appointment
exports.bookAppointment = async (req, res) => {
  try {
     //Collect and validate the required data
    const { doctorID, date, time, specialty, telehealth } = req.body;
    if (!doctorID || !date || !time || !specialty) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    //Check patient subscribtion status
    const patientID = req.patient.patientID;
    const patient=await Patient.findOne({patientID:patientID})
    if(!patient.hasSubscription)return res.status(403).json({message:"You have no subscription"})
    
    //Check patient bookable Bookings
    const availableSlot= await BookingSlot.findOne({owner:patientID});
    const today=new Date();
    if(!availableSlot || availableSlot.booking<1 || availableSlot.expirationDate<today){
      return res.status(403).json({message:"You have no available Booking slot for booking new appointment"})
    }
    
     //Verify doctor and subscription status
    const doctor = await Doctor.findOne({ docOnID: doctorID });
    if (!doctor || !doctor.hasSubscription) {
      return res.status(404).json({
        message: "Invalid doctor's credentials provided or Doctor cannot accept appointment for now",
      });
    }
    
   //Check and create telehealth link and access token 
    let telehealthLink="";
    let accessToken="";
    let availableTelehealth=availableSlot.video
    if(availableTelehealth>0){
        const roomName = `appointment_${doctorID}_${Date.now()}`;
        ( { telehealthLink, accessToken } = await createTwilioRoomAndToken(roomName, "DocOn"));
      availableTelehealth-=1
    }
    
    const appointment = new Appointment({
      appointmentID: v4(),
      doctorDetails:doctor._id,
      patientDetails:patient._id,
      date,
      time,
      specialty,
      telehealthLink,
      telehealthAccess:accessToken,
    });
 const booked =  await appointment.save();
if(!booked)return res.status(400).json({messsge:"Unable to book appointment"})
  
    //check if patient can still book another appointment
    const remainingSlot=availableSlot.booking-1; 
 if(remainingSlot<1){
    //Delete Booking slot
      await Bookingslot.findByIdAndDelete({_id:availableSlot._id})
      //update user subscription status
      patient.hasSubscription=false;
      await patient.save();
 }else{  
    //Update Slot
    const updatedSlot=await BookingSlot.findByIdAndUpdate({
      _id:availableSlot._id,
    },{
      video:availableTelehealth,
      booking:remainingSlot
    },
    {new:true})
   // if(!updatedSlot)//mesage the website administrator
 }
    //Send mail and sms to Patient
    await Mailer.sendEmail(
      req.patient.email,
      "Appointment Booked Successfully",
    `<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
      h2 { color: #4CAF50; }
      table { border-collapse: collapse; width: 100%; margin-top: 20px; }
      th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
      th { background-color: #f2f2f2; }
      a { color: #4CAF50; text-decoration: none; }
    </style>
  </head>
  <body>
    <h2>Appointment Successfully Booked</h2>
    <p>Dear ${req.patient.firstName},</p>
    <p>Your appointment has been successfully booked. Below are the details of your appointment:</p>
    <h4>Appointment Details:</h4>
    <table>
      <tr>
        <th>Doctor's Name</th>
        <td>Dr. ${doctor.firstName}</td>
      </tr>
      <tr>
        <th>Date</th>
        <td>${date}</td>
      </tr>
      <tr>
        <th>Time</th>
        <td>${time}</td>
      </tr>
      <tr>
        <th>Reason</th>
        <td>${specialty}</td>
      </tr>
    </table>
    <p>If you have any questions or need to reschedule, please contact us at <a href="mailto:alsesitechnologies.com">alsesitechnologies.com</a>.</p>
    <p>Best regards,<br><strong>DocOn Team</strong><br>alsesitechnologies.com</p>
  </body>
</html>
`);
    //Restructure the number
    const getNumber=String(req.patient.phoneNumber)
    const smsNumber= `234${getNumber.slice(-10)}` 
    await sendSMS(
    smsNumber,
   //2347051024341,
    `Hello ${req.patient.firstName},
Your appointment has been successfully booked with Dr. ${doctor.firstName}.
    
Appointment Details:
Date: ${date}
Time: ${time}
Reason: ${specialty}
If you have any questions or need to reschedule, please contact us at support@docon.com.

Best regards,
DocOn Team`
  );

    //Send mail to Doctor
    await Mailer.sendEmail(
      doctor.email,
      "New Appointment Scheduled",
    `<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
      h2 { color: #4CAF50; }
      table { border-collapse: collapse; width: 100%; margin-top: 20px; }
      th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
      th { background-color: #f2f2f2; }
      a { color: #4CAF50; text-decoration: none; }
    </style>
  </head>
  <body>
    <h2>Appointment Confirmation</h2>
    <p>Dear Dr. ${doctor.firstName},</p>
    <p>An appointment has been successfully booked with you. Below are the appointment details:</p>
    <h4>Appointment Details:</h4>
    <table>
      <tr>
        <th>Patient Name</th>
        <td>${req.patient.firstName}</td>
      </tr>
      <tr>
        <th>Date</th>
        <td>${date}</td>
      </tr>
      <tr>
        <th>Time</th>
        <td>${time}</td>
      </tr>
      <tr>
        <th>Reason</th>
        <td>${specialty}</td>
      </tr>
    </table>
    <p>If you have any questions, please contact our support team at <a href="mailto:alsesitechnologies.com">support@docon.com</a>.</p>
    <p>Best regards,<br><strong>DocOn Team</strong><br>alsesitechnologies.com</p>
  </body>
</html>
`);
    res.status(201).json({ message: "Appointment created successfully", appointment });
  } catch (error) {
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${error.message}`,
    });
  }
};

// Get appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findOne({ appointmentID: id })
       .populate([{path:"doctorDetails", select:"-_id firstName lastName email docOnID specialty phoneNumber"},
                  {path:"patientDetails", select:"-_id patientID firstName lastName email phoneNumber"}]);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add to waitlist
exports.addToWaitlist = async (req, res) => {
  try {
    const { id } = req.params;
    if(!id)res.status(400).json({message:"Invalid or no id provided"})
    const doctorID = req.doctor.docOnID;
    const doctor = await Doctor.findOne({ docOnID: doctorID });
    
    const appointment = await Appointment.findOne({ appointmentID: id });
    if (!appointment) {
      return res.status(404).json({
        title: "Appointment not found",
        message: "Appointment with the provided ID not found",
      });
    }
    
    if (!appointment.doctorDetails.equals(doctor._id)) {
      return res.status(401).json({
        title: "Unauthorized Access",
        message: "You are not authorized to waitlist this appointment.",
      });
    }

    if (appointment.status !== "available") {
      return res.status(400).json({
        title: "Appointment Not in Waitlist",
        message: "The appointment is not available for waitlisting.",
      });
    }

    appointment.status = "waiting";
    await appointment.save();

    const patient = await Patient.findOne({ _id: appointment.patientDetails }).select("phoneNumber email");
    const getNumber=String(patient.phoneNumber)
    const smsNumber= `234${getNumber.slice(-10)}` 

    await sendSMS(
      smsNumber,
      `Your appointment with Dr. ${req.doctor.firstName} has been waitlisted. You will be notify when the appointment session will commence.
    Thank you`
    );
const message=`<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 20px; background-color: #f9f9f9;">
    <div style="max-width: 600px; margin: 20px auto; background: #ffffff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <p>Your appointment with <strong>Dr. ${req.doctor.firstName}</strong> has been <strong>waitlisted</strong>. You will be notified when the appointment session will commence.</p>
      <p style="margin-top: 20px;">If you have any questions, please contact our support team at <a href="mailto:support@docon.com" style="color: #4CAF50; text-decoration: none;">support@docon.com</a>.</p>
      <p>Best regards,</p>
      <p><strong>DocOn Team</strong><br>alsesitechnologies.com</p>
    </div>
    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
      &copy; 2025 DocOn. All rights reserved.
    </div>
  </body>
</html>
`;
    await Mailer.sendEmail(
      patient.email,
      "Appointment Waitlisted",
      message
    );

    res.status(200).json({
      title: "Added to Waitlist",
      message: "Appointment has been added to the waitlist successfully.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove from waitlist and make ready
exports.removeFromWaitlistAndReady = async (req, res) => {
  try {
    const { id } = req.params;
    if(!id)res.status(400).json({message:"Invalid or no id provided"})
    const doctorID = req.doctor.docOnID;
    const doctor = await Doctor.findOne({ docOnID: doctorID });
    
    const appointment = await Appointment.findOne({ appointmentID: id });
    if (!appointment) {
      return res.status(404).json({
        title: "Appointment not found",
        message: "Appointment with the provided ID not found",
      });
    }
    
    if (!appointment.doctorDetails.equals(doctor._id)) {
      return res.status(401).json({
        title: "Unauthorized Access",
        message: "You are not authorized to waitlist this appointment.",
      });
    }

    if (!appointment || appointment.status!== "waiting") {
      return res.status(400).json({
        title: "No Patients in Waitlist",
        message: "The appointment does not in the waitlist.",
      });
    }

    appointment.status = "available";
    await appointment.save();

    const patient = await Patient.findOne({ _id: appointment.patientDetails }).select("phoneNumber email");
    const getNumber=String(patient.phoneNumber)
    const smsNumber= `234${getNumber.slice(-10)}` 
    
   await sendSMS(
      smsNumber,
      `Your appointment session with Dr. ${req.doctor.firstName} is now ready to start.
    Thank you`
    );
    
const message=`<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 20px; background-color: #f9f9f9;">
    <div style="max-width: 600px; margin: 20px auto; background: #ffffff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <p>Your appointment session with <strong>Dr. ${req.doctor.firstName}</strong> is now ready to start.</p>
      <p style="margin-top: 20px;">If you have any questions, please contact our support team at <a href="mailto:support@docon.com" style="color: #4CAF50; text-decoration: none;">support@docon.com</a>.</p>
      <p>Best regards,</p>
      <p><strong>DocOn Team</strong><br>alsesitechnologies.com</p>
    </div>
    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
      &copy; 2025 DocOn. All rights reserved.
    </div>
  </body>
</html>`
    await Mailer.sendEmail(
      patient.email,
      "Appointmet Session Ready",
    message
         );

    res.status(200).json({
      title: "Appointment Session Ready",
      message: "Appointment session is now ready to begin with the patient.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Transaction Statistics
exports.getStatistics = async (req, res) => {
  try {
    const allAppoitments = await Appointment.countDocuments();
    const newAppoitments = await Appointment.countDocuments({ status: "available" });
    const waitlistedAppoitments = await Appointment.countDocuments({ status: "waiting" });
   
    if (typeof allAppoitment !== "number" || typeof newAppoitment !=="number") {
      return res.status(404).json({ message: "Unable to fetch Patient statistics." });
    }
    res.status(200).json({allAppoitments, newAppoitments, waitlistedAppointments});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
