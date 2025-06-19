const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: function () {
      return this.type === "lesson";
    },
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: function () {
      return this.type === "course";
    },
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "USD",
  },
  status: {
    type: String,
    enum: ["pending", "completed", "refunded"],
    default: "pending",
  },
  type: {
    type: String,
    enum: ["lesson", "course"],
    required: true,
  },
  stripePaymentId: { type: String },
  stripeSessionId: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Payment", PaymentSchema);
