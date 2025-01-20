const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;

const client = twilio(accountSid, authToken);

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

//ENV VARIABLES
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret


