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
 
/*
  ENV VARIABLES
TWILIO_ACCOUNT_SID=your_account_sid=AC521eb38c0e9863a25d528e3e80416ebf
TWILIO_AUTH_TOKEN=your_auth_token=0ed3cec5591af978282da768cda1602f
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid=MGb048f4dbabc7052ebe6670c9524d89e4
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_SENDER_EMAIL=your_verified_sender_email
*/