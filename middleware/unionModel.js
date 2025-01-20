const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  subscriberID: {
    type: String,
    required: true,
    unique: true, // Ensure subscriberID is unique
  },
  type: {
    type: String,
    enum: ['patient', 'doctor'], // Distinguish between types
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Store additional details
  },
});

userSchema.statics.findSubscriberDetails = async function (userID) {
  try {
    const user = await this.findOne({ userID });
    if (!user) {
      return null;
    }
    return user;
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model('user', userSchema);
module.exports = User;
