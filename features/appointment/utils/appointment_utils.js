const twilio = require("twilio");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const client = twilio(accountSid, authToken);

//sms notification service
exports.sendSMS = async (to, message) => {
  try {
    await client.messages.create({
      body: message,
      from: messagingServiceSid, // Use Twilio's messaging service SID
      to,
    });
   // console.log(`SMS sent to ${to}`);
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    throw new Error("Failed to send SMS");
  }
};

//email notification
exports.sendEmail = async (to, subject, body) => {
  try {
    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to,
      from: process.env.SENDGRID_SENDER_EMAIL, // Verified sender email
      subject,
      html: body,
    };

    await sgMail.send(msg);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Failed to send email");
  }
};

//video 
exports.createTwilioRoomAndToken = async (roomName, participantName) => {
  try {
    // Create a video room
    await client.video.rooms.create({
      uniqueName: roomName,
      type: "group", // Use "group-small" for smaller rooms
    });

    // Generate an access token for the participant
    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const token = new AccessToken(accountSid, apiKey, apiSecret);
    token.identity = participantName; // Assign participant identity
    token.addGrant(new VideoGrant({ room: roomName }));

    // Return the room link and access token
    return {
      telehealthLink: `https://video.twilio.com/${roomName}`,
      accessToken: token.toJwt(),
    };
  } catch (error) {
    console.error("Error creating Twilio room or token:", error);
    throw new Error("Failed to create Twilio video room");
  }
};
