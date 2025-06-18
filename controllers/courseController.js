const Course = require("../models/courseModel");
const User = require("../models/userModel"); // Assuming you have this model
const qs = require("qs");

const courseController = {
  // Create a new course
  createCourse: async (req, res) => {
    try {
      const isUrlEncoded = req.headers["content-type"]?.includes(
        "application/x-www-form-urlencoded"
      );
      const courseData = isUrlEncoded ? qs.parse(req.body) : req.body;

      courseData.mentorId = req.userId;

      // Parse nested JSON fields if they are in string format
      const parseIfString = (field) =>
        typeof field === "string" ? JSON.parse(field) : field;

      courseData.duration = parseIfString(courseData.duration);
      courseData.schedule = parseIfString(courseData.schedule);
      courseData.pricing = parseIfString(courseData.pricing);
      courseData.enrollmentSettings = parseIfString(
        courseData.enrollmentSettings
      );
      courseData.timeline = parseIfString(courseData.timeline);
      courseData.visibility = parseIfString(courseData.visibility);
      courseData.tags = parseIfString(courseData.tags);

      // File Upload
      if (req.file) {
        courseData.media = {
          coverImage: `${req.protocol}://${req.get("host")}/uploads/${
            req.file.filename
          }`,
        };
      }

      const newCourse = new Course(courseData);

      const validationError = newCourse.validateSync();
      if (validationError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: Object.keys(validationError.errors).reduce((acc, key) => {
            acc[key] = validationError.errors[key].message;
            return acc;
          }, {}),
        });
      }

      await newCourse.save();
      res.status(201).json({
        success: true,
        message: "Course created successfully",
        data: newCourse,
      });
    } catch (error) {
      console.error("Create course error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Get all courses
  getAllCourses: async (req, res) => {
    try {
      const filters = {};

      if (req.query.subject) filters.subject = req.query.subject;
      if (req.query.level) filters.level = req.query.level;
      if (req.query.mentorId) filters.mentorId = req.query.mentorId;

      if (req.query.minPrice || req.query.maxPrice) {
        filters["pricing.totalPrice"] = {};
        if (req.query.minPrice)
          filters["pricing.totalPrice"].$gte = Number(req.query.minPrice);
        if (req.query.maxPrice)
          filters["pricing.totalPrice"].$lte = Number(req.query.maxPrice);
      }

      if (req.query.tag) {
        filters.tags = { $in: [req.query.tag] };
      }

      if (req.query.startDate) {
        filters["timeline.startDate"] = { $gte: new Date(req.query.startDate) };
      }

      const courses = await Course.find(filters).populate(
        "mentorId",
        "name email"
      );

      res.status(200).json({ success: true, data: courses });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get single course
  getCourseById: async (req, res) => {
    try {
      const course = await Course.findById(req.params.id).populate(
        "mentorId",
        "name email"
      );
      if (!course)
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });

      res.status(200).json({ success: true, data: course });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  // Get all enrolled courses for a student
  getEnrolledCourses: async (req, res) => {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId).populate({
        path: "enrolledCourses",
        populate: {
          path: "mentorId",
          select: "name email",
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        success: true,
        data: user.enrolledCourses || [],
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch enrolled courses" });
    }
  },

  // Get mentor's courses
  getMentorCourse: async (req, res) => {
    try {
      const courses = await Course.find({ mentorId: req.userId });
      res.status(200).json({ success: true, data: courses });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Update course
  updateCourse: async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course)
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });

      if (course.mentorId.toString() !== req.userId.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized" });
      }

      const updatedData = req.body;

      // Parse and assign nested JSON
      [
        "duration",
        "schedule",
        "pricing",
        "enrollmentSettings",
        "timeline",
        "visibility",
        "tags",
      ].forEach((field) => {
        if (updatedData[field]) {
          updatedData[field] =
            typeof updatedData[field] === "string"
              ? JSON.parse(updatedData[field])
              : updatedData[field];
        }
      });

      if (req.file) {
        updatedData.media = {
          coverImage: `${req.protocol}://${req.get("host")}/uploads/${
            req.file.filename
          }`,
        };
      }

      Object.assign(course, updatedData);
      await course.save();

      res
        .status(200)
        .json({ success: true, message: "Course updated", data: course });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Delete course
  deleteCourse: async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course)
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });

      if (course.mentorId.toString() !== req.userId.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized" });
      }

      await course.deleteOne();
      res.status(200).json({ success: true, message: "Course deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Enroll in a course
  enrollInCourse: async (req, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.user._id;

      const course = await Course.findById(courseId);
      const user = await User.findById(userId);

      if (!course) return res.status(404).json({ message: "Course not found" });

      if (user.enrolledCourses.includes(courseId)) {
        return res
          .status(400)
          .json({ message: "Already enrolled in this course" });
      }

      // Check for schedule clashes (simplified: you can enhance with actual time checking)
      const enrolledCourses = await Course.find({
        _id: { $in: user.enrolledCourses },
      });
      const hasClash = enrolledCourses.some((c) => {
        return (
          JSON.stringify(c.schedule.daysOfWeek) ===
            JSON.stringify(course.schedule.daysOfWeek) &&
          c.schedule.classTime.startTime === course.schedule.classTime.startTime
        );
      });

      if (hasClash) {
        return res
          .status(400)
          .json({ message: "Schedule clashes with another enrolled course" });
      }

      user.enrolledCourses.push(courseId);
      await user.save();

      res.status(200).json({ message: "Enrolled successfully", course });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Enrollment failed" });
    }
  },
};

module.exports = courseController;
