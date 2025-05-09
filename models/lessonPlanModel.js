const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["scheduled", "completed", "canceled"],
    default: "scheduled",
  },
  meetingLink: { type: String },
  recordingUrl: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("LessonPlan", LessonSchema);
