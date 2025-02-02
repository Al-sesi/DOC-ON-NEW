const { getIOInstance } = require("../../../config/socket_config");
const multer = require("multer");
const path = require("path");
const Thread = require("../model/thread_model");
const Message = require("../model/messaging_model");
const Appointment = require("../../appointment/model/appointment_model");
const doctorModel = require("../../doctor/model/doctor.model");
const Patient = require("../../patient/model/patient.model");

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// Create a new thread
exports.createThread = async (req, res) => {
    try {
        
        const verifyID=req.patient?.patientID || req.docotor.docOnID;
        const { docOnID, patientID, appointmentID } = req.body;
        if(!docOnID || !patientID || !appointmentID)return res.status(400).json({message:"All field are required"})
        
        if(verifyID!==patientID && varifyID !== docOnID)return res.status(400).json({message:"Incorrect credentials"})
        
        //Verify both has appointment with each other 
        const verifyAppointment= await Appointment.findOne({appointmentID})
        
        const verifyDoc=await doctorModel.findOne({docOnID:docOnID}).select("_id")
        const verifyPat=await Patient.findOne({patientID:patientID}).select("_id")
        
        const inputDate = verifyAppointment.date.replace(/\//g, '-'); // Ensure date is in YYYY-MM-DD format
        const inputTime = verifyAppointment.time;
        const formattedTime = `${inputTime.slice(0, 2)}:${inputTime.slice(2, 4)}:00`;
        const today = new Date();
        const todayDate = today.toISOString().split('T')[0]; // Extract YYYY-MM-DD
        const currentTime = today.toTimeString().split(' ')[0]; // Extract HH:MM:SS

// Combine inputDate and inputTime into a Date object
const appointmentDateTime = new Date(`${inputDate}T${formattedTime}`);
        
        // Calculate time thresholds
const twoHoursBefore = new Date(appointmentDateTime.getTime() - (2 * 60 * 60 * 1000)); // 2 hours before appointment time
const oneHourAfter = new Date(appointmentDateTime.getTime() + (1 * 60 * 60 * 1000)); // 1 hour after appointment time
  if (
        !verifyAppointment // No appointment found
        || todayDate !== inputDate // Appointment date doesn't match today's date
        || today < twoHoursBefore  // Current time is more than 2 hours before the appointment
        || today > oneHourAfter  // Current time is more than 1 hour past the appointment
        || !verifyAppointment.doctorDetails.equals(verifyDoc._id)  // Doctor doesn't match
        || !verifyAppointment.patientDetails.equals(verifyPat._id) // Patient doesn't match
) {
  return res
    .status(401)
    .json({
      message:
        "Unauthorized to chat as both have no appointment with each other or chat duration has exceeded",
    });
}
        const existingThread = await Thread.findOne({
            participants: { $all: [docOnID, patientID] },
        });

        if (existingThread) {
            const newThread=await Thread.findOneAndUpdate({threadID:existingThread.threadID},
            {validTill:oneHourAfter,
           validFrom:twoHoursBefore,
         }, {new:true})
              //await existingThread.save()
            return res.status(200).json(newThread);
        }

        const thread = new Thread({
            participants: [docOnID, patientID], 
            validTill:oneHourAfter,
            validFrom:twoHoursBefore,
        });
        await thread.save();
       const io = getIOInstance();
        io.emit("new-thread", thread);
        res.status(201).json(thread);
    } catch (error) {
        res.status(500).json({ error: "Failed to create thread: " + error.message });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    upload.single("file")(req, res, async (err) => {
        if (err) return res.status(500).json({ error: "File upload failed" });

        try {
            const { threadId, senderId, recipientId, content } = req.body;
            const filePath = req.file ? req.file.path : null;

            const thread = await Thread.findOne({threadID:threadId});
            if (!thread) {
                return res.status(404).json({ error: "Thread not found" });
            }
              const now=new Date();
            //Allow only participants for valid thread timing
           if(
            !thread.participants.includes(senderId) 
            || !thread.participants.includes(recipientId)
            || now < thread.validFrom 
            || now > thread.validTill
            ){
             return res.status(400).json({message:"Unathorize!"})
           }
            const message = new Message({ threadId, senderId, recipientId, content, file: filePath });
            await message.save();

            thread.messages.push(message._id);
            await thread.save();

            // Emit the message to participants in the thread
               const io = getIOInstance();
            
               io.to(threadId).emit("new-message", { threadId, senderId, content });
            res.status(201).json(message);
        } catch (error) {
            res.status(500).json({ error: "Failed to send message: " + error.message });
        }
    });
};

// Get all threads for a user
exports.getThreadsByUser = async (req, res) => {
    try {
        const {userId} = req.params;
        
       const patientID=req.patient?.patientID;
       const docOnID=req.doctor?.docOnID
        const fetcherID= patientID || docOnID;
        
        if(userId!== fetcherID)return res.status(403).json({message:"Unauthorize Access"})
        const threads = await Thread.find({ participants: userId }).select("-_id threadID participants")
        
  // Populate subscriberID details
    const threadsWithRecipients = await Promise.all(
      threads.map(async (thread) => {
        const threadObj = thread.toObject()
          
    const recipientID= threadObj.participants.filter(item => item !== fetcherID).join("");
          let receiver=null;
          if(patientID){
              receiver = await doctorModel.findOne({docOnID: recipientID })
             .select("-_id docOnID email role phoneNumber firstName LastName");
              //console.log("calling Doc", receiv)
          }else{
             receiver = await Patient.findOne({ patientID:recipientID })
            .select("-_id patientID email role phoneNumber firstName LastName");
          }
        // Attach the subscriber details to the transaction
        return {
          ...thread.toObject(),
          receiver, // Populate with the found details
        };
      })
    );
        res.status(200).json(threadsWithRecipients);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch threads: " + error.message });
    }
};

// Get messages for a thread
exports.getMessagesByThread = async (req, res) => {
    try {
        const { threadId } = req.params;
        const id=req.patient?.patientID || req.doctor?.docOnID;
        
       const verifyParticipant= await Thread.findOne({threadID:threadId})
        if(!verifyParticipant) return res.status(400).json({message:"Invalid thread id provided"});
        
        if(!verifyParticipant.participants.includes(id))return res.status(403).json({messages:"You are not authorized to see this chat"});
            
        const messages = await Message.find({ threadId }).sort({ createdAt: 1 })
        .select("content recipientId senderId timestamp -_id");
        res.status(200).json(messages)
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages: " + error.message });
    }
};
