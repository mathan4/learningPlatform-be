const mongoose = require('mongoose');

const MentorRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // prevent duplicate requests
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
  },
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
  documents: [String], // file paths or URLs
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("MentorRequest", MentorRequestSchema);
