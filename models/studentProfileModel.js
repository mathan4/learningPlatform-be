const mongoose = require('mongoose');

const StudentProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  interests: [
    {
      type: String,
    },
  ],
  educationLevel: {
    type: String,
  },
  preferredSubjects: [
    {
      type: String,
    },
  ],
  timezone: {
    type: String,
  },
  bio: {
    type: String,
  },
});

module.exports = mongoose.model("StudentProfile", StudentProfileSchema);
