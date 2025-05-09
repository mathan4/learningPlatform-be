const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: true,
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
  stripePaymentId: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Payment", PaymentSchema);
