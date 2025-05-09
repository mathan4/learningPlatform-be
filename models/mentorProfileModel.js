const mongoose = require('mongoose');

const MentorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  qualifications: [
    {
      degree: { type: String },
      institution: { type: String },
      year: { type: Number },
    },
  ],
  subjects: [
    {
      type: String,
    },
  ],
  experience: {
    type: Number,
  }, // years
  hourlyRate: {
    type: Number,
    required: true,
  },
  bio: {
    type: String,
  },
  availability: [
    {
      day: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      startTime: { type: String },
      endTime: { type: String },
    },
  ],
  averageRating: {
    type: Number,
    default: 0,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
})

module.exports = mongoose.model("MentorProfile", MentorProfileSchema);
