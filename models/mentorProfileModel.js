const mongoose = require('mongoose');

const MentorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // Ensure one mentor profile per user
    index: true, // Index for better query performance
  },
  qualifications: [
    {
      degree: { 
        type: String,
        required: true,
        trim: true
      },
      institution: { 
        type: String,
        required: true,
        trim: true
      },
      year: { 
        type: Number,
        min: 1950,
        max: new Date().getFullYear() + 10 // Allow future graduation dates
      },
    },
  ],
  subjects: [
    {
      type: String,
      trim: true,
      // You might want to add validation for allowed subjects
      enum: [
        'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
        'English', 'History', 'Geography', 'Economics', 'Psychology',
        'Literature', 'Philosophy', 'Sociology', 'Political Science',
        'Engineering', 'Business', 'Accounting', 'Finance', 'Marketing',
        'Art', 'Music', 'Languages', 'Medicine', 'Nursing', 'Law'
      ]
    },
  ],
  experience: {
    type: Number,
    min: 0,
    max: 50,
    default: 0
  }, // years
  hourlyRate: {
    type: Number,
    required: true,
    min: 1,
    max: 1000, // Set reasonable limits
    index: true, // Index for filtering by rate
  },
  bio: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  availability: [
    {
      day: {
        type: String,
        required: true,
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
      startTime: { 
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            // Validate time format (HH:MM)
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Start time must be in HH:MM format'
        }
      },
      endTime: { 
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            // Validate time format (HH:MM)
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'End time must be in HH:MM format'
        }
      },
    },
  ],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    index: true, // Index for sorting by rating
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true, // To filter active mentors
  },
  profileImage: {
    type: String, // URL to profile image
    trim: true
  },
  languages: [
    {
      type: String,
      trim: true
    }
  ],
  // For better search functionality
  searchableText: {
    type: String,
    index: 'text' // Text index for search
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
MentorProfileSchema.index({ subjects: 1 });
MentorProfileSchema.index({ 'availability.day': 1 });
MentorProfileSchema.index({ averageRating: -1, hourlyRate: 1 });
MentorProfileSchema.index({ isActive: 1, averageRating: -1 });

module.exports = mongoose.model("MentorProfile", MentorProfileSchema);