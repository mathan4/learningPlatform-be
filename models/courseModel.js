const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  duration: {
    weeks: {
      type: Number,
      required: true
    },
    totalHours: {
      type: Number,
      required: true
    }
  },
  schedule: {
    daysOfWeek: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    }],
    classTime: {
      startTime: { type: String, required: true },
      endTime: { type: String, required: true }
    },
    sessionDuration: {
      type: Number,
      required: true
    }
  },
  pricing: {
    totalPrice: {
      type: Number,
      required: true
    },
    paymentType: {
      type: String,
      enum: ['full-upfront', 'weekly', 'per-session'],
      required: true
    }
  },
  enrollmentSettings: {
    enrollmentDeadline: {
      type: Date,
      required: true
    },
    maxStudents: {
      type: Number,
      required: true
    },
    minStudents: {
      type: Number,
      required: true
    }
  },
  timeline: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  visibility: {
    isPublic: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isPromoted: {
      type: Boolean,
      default: false
    }
  },
  tags: [String],
  media: {
    coverImage: {
      type: String
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema);
