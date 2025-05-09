const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },

  firstName: {
    type: String,
    required: true,
  },

  lastName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["student", "tutor", "admin"],
    required: true,
    default: "student",
  },
  profilePicture: {
    type: String,
  },
  location: {
    type: String,
  },
  languagesKnown: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("User", UserSchema);
