const Course = require("../models/courseModel");
const User = require("../models/userModel"); // Assuming you have this model
const qs = require("qs");
const mongoose = require("mongoose");

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
        "firstName lastName"
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
    console.log("=== DEBUG getEnrolledCourses START ===");

    try {
      // Log request context
      console.log("Request headers:", req.headers);
      console.log("Request cookies:", req.cookies);
      console.log("Request userId:", req.userId);

      const userId = req.userId;

      // Step 1: Validate userId presence
      if (!userId) {
        console.log("ERROR: userId is missing from request");
        return res.status(401).json({
          success: false,
          message: "Unauthorized. User ID not found in request.",
        });
      }

      // Step 2: Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.log("ERROR: Invalid ObjectId format:", userId);
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format",
        });
      }

      // Step 3: Check user existence
      const userExists = await User.findById(userId);
      if (!userExists) {
        console.log("ERROR: User not found for ID:", userId);
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      console.log(
        "User found. Fetching enrolled courses with mentor details..."
      );

      // Step 4: Fetch user with populated enrolledCourses
      const user = await User.findById(userId).populate({
        path: "enrolledCourses",
        populate: {
          path: "mentorId",
          match: { role: "mentor" }, // optional safeguard
          select: "firstName lastName email",
        },
      });

      // Step 5: Filter out broken mentor references
      const enrolledCourses = (user.enrolledCourses || []).filter(
        (course) => course && course.mentorId
      );

      console.log("Final enrolledCourses to return:", enrolledCourses.length);

      res.status(200).json({
        success: true,
        data: enrolledCourses,
        count: enrolledCourses.length,
      });

      console.log("=== DEBUG getEnrolledCourses SUCCESS ===");
    } catch (err) {
      console.log("=== DEBUG getEnrolledCourses ERROR ===");
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);

      // Specific error messages
      if (err.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format",
          error: err.message,
        });
      }

      if (err.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          error: err.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to fetch enrolled courses",
        error: err.message,
      });
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
  // Updated enrollInCourse with full debugging
enrollInCourse: async (req, res) => {
  console.log('=== ENROLLMENT DEBUG START ===');
  
  try {
    const { courseId } = req.params;
    console.log('1. CourseId from params:', courseId);
    
    // Debug all possible user-related properties
    console.log('2. Request object debugging:');
    console.log('   - req.user:', req.user);
    console.log('   - req.userId:', req.userId);
    console.log('   - req.user?._id:', req.user?._id);
    console.log('   - req.user?.id:', req.user?.id);
    console.log('   - All req keys containing "user":', Object.keys(req).filter(key => key.toLowerCase().includes('user')));
    
    // Debug headers and cookies
    console.log('3. Auth debugging:');
    console.log('   - Authorization header:', req.headers.authorization);
    console.log('   - Cookie header:', req.headers.cookie);
    console.log('   - Token from cookie:', req.cookies?.token);
    
    // Try to get userId with multiple fallbacks
    const userId = req.userId || req.user?._id || req.user?.id || req.user;
    console.log('4. Final userId determined:', userId);
    console.log('   - Type of userId:', typeof userId);
    console.log('   - Is userId truthy:', !!userId);
    
    if (!userId) {
      console.log('❌ FAILED: No userId found');
      return res.status(401).json({ 
        success: false, 
        message: "Authentication failed - no user ID found",
        debug: {
          user: req.user,
          userId: req.userId,
          availableKeys: Object.keys(req).filter(key => key.toLowerCase().includes('user'))
        }
      });
    }

    console.log('5. Fetching course and user from database...');
    
    // Fetch course
    const course = await Course.findById(courseId);
    console.log('   - Course found:', !!course);
    console.log('   - Course title:', course?.title);
    console.log('   - Course enrolled students:', course?.enrolledStudents?.length || 0);
    console.log('   - Course max students:', course?.enrollmentSettings?.maxStudents);

    if (!course) {
      console.log('❌ FAILED: Course not found');
      return res.status(404).json({ 
        success: false, 
        message: "Course not found",
        debug: { courseId }
      });
    }

    // Fetch user
    const user = await User.findById(userId);
    console.log('   - User found:', !!user);
    console.log('   - User ID:', user?._id);
    console.log('   - User enrolled courses:', user?.enrolledCourses?.length || 0);

    if (!user) {
      console.log('❌ FAILED: User not found');
      return res.status(404).json({ 
        success: false, 
        message: "User not found",
        debug: { userId, userIdType: typeof userId }
      });
    }

    console.log('6. Checking enrollment validations...');

    // Check if user is already enrolled (user side)
    const userAlreadyEnrolled = user.enrolledCourses.includes(courseId);
    console.log('   - User already enrolled (user side):', userAlreadyEnrolled);
    
    if (userAlreadyEnrolled) {
      console.log('❌ FAILED: User already enrolled (user side)');
      return res.status(400).json({ 
        success: false, 
        message: "Already enrolled in this course",
        debug: { 
          userEnrolledCourses: user.enrolledCourses,
          courseId 
        }
      });
    }

    // Check if user is already enrolled (course side)
    const courseAlreadyHasUser = course.enrolledStudents.includes(userId);
    console.log('   - Course already has user (course side):', courseAlreadyHasUser);
    
    if (courseAlreadyHasUser) {
      console.log('❌ FAILED: User already enrolled (course side)');
      return res.status(400).json({ 
        success: false, 
        message: "Already enrolled (course side)",
        debug: { 
          courseEnrolledStudents: course.enrolledStudents,
          userId 
        }
      });
    }

    // Check course capacity
    const currentEnrollment = course.enrolledStudents.length;
    const maxStudents = course.enrollmentSettings.maxStudents;
    const isFull = currentEnrollment >= maxStudents;
    console.log('   - Current enrollment:', currentEnrollment);
    console.log('   - Max students:', maxStudents);
    console.log('   - Course is full:', isFull);

    if (isFull) {
      console.log('❌ FAILED: Course is full');
      return res.status(400).json({ 
        success: false, 
        message: "Course is already full",
        debug: { 
          currentEnrollment,
          maxStudents 
        }
      });
    }

    console.log('7. Checking schedule conflicts...');

    // Check schedule clashes
    const enrolledCourses = await Course.find({
      _id: { $in: user.enrolledCourses },
    });
    console.log('   - User has', enrolledCourses.length, 'enrolled courses to check');

    const hasClash = enrolledCourses.some((c, index) => {
      const clash = (
        JSON.stringify(c.schedule.daysOfWeek) === JSON.stringify(course.schedule.daysOfWeek) &&
        c.schedule.classTime.startTime === course.schedule.classTime.startTime
      );
      
      console.log(`   - Course ${index + 1} (${c.title}):`);
      console.log(`     - Days: ${JSON.stringify(c.schedule.daysOfWeek)} vs ${JSON.stringify(course.schedule.daysOfWeek)}`);
      console.log(`     - Time: ${c.schedule.classTime.startTime} vs ${course.schedule.classTime.startTime}`);
      console.log(`     - Has clash: ${clash}`);
      
      return clash;
    });

    console.log('   - Overall schedule clash:', hasClash);

    if (hasClash) {
      console.log('❌ FAILED: Schedule clash detected');
      return res.status(400).json({
        success: false,
        message: "Schedule clashes with another enrolled course",
        debug: {
          newCourseSchedule: {
            days: course.schedule.daysOfWeek,
            time: course.schedule.classTime.startTime
          },
          conflictingCourses: enrolledCourses.map(c => ({
            title: c.title,
            days: c.schedule.daysOfWeek,
            time: c.schedule.classTime.startTime
          }))
        }
      });
    }

    console.log('8. Proceeding with enrollment...');

    // Add user to course and course to user
    console.log('   - Adding courseId to user.enrolledCourses');
    user.enrolledCourses.push(courseId);
    
    console.log('   - Adding userId to course.enrolledStudents');
    course.enrolledStudents.push(userId);

    console.log('9. Saving to database...');
    
    // Save both documents
    await user.save();
    console.log('   - User saved successfully');
    
    await course.save();
    console.log('   - Course saved successfully');

    console.log('✅ SUCCESS: Enrollment completed');
    console.log('=== ENROLLMENT DEBUG END ===');

    res.status(200).json({ 
      success: true, 
      message: "Enrolled successfully", 
      course,
      debug: {
        userId,
        courseId,
        newEnrollmentCount: course.enrolledStudents.length,
        userCourseCount: user.enrolledCourses.length
      }
    });

  } catch (err) {
    console.log('❌ EXCEPTION in enrollInCourse:');
    console.error('Error details:', err);
    console.log('Error stack:', err.stack);
    console.log('=== ENROLLMENT DEBUG END (WITH ERROR) ===');
    
    res.status(500).json({
      success: false,
      message: "Enrollment failed",
      error: err.message,
      debug: {
        errorType: err.constructor.name,
        errorMessage: err.message
      }
    });
  }
},// ============================================
// BACKEND - Add to courseController.js
// ============================================

cancelEnrollment: async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId || req.user?._id;

    console.log('=== CANCEL ENROLLMENT START ===');
    console.log('CourseId:', courseId);
    console.log('UserId:', userId);

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    // Fetch course and user
    const course = await Course.findById(courseId);
    const user = await User.findById(userId);

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: "Course not found" 
      });
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Check if user is actually enrolled
    const isEnrolledInUser = user.enrolledCourses.includes(courseId);
    const isEnrolledInCourse = course.enrolledStudents.includes(userId);

    console.log('User enrolled (user side):', isEnrolledInUser);
    console.log('User enrolled (course side):', isEnrolledInCourse);

    if (!isEnrolledInUser && !isEnrolledInCourse) {
      return res.status(400).json({ 
        success: false, 
        message: "You are not enrolled in this course" 
      });
    }

    // Check if course has started (optional - you might want to prevent cancellation after start)
    const courseStartDate = new Date(course.timeline.startDate);
    const now = new Date();
    const canCancel = now < courseStartDate;

    console.log('Course start date:', courseStartDate);
    console.log('Current date:', now);
    console.log('Can cancel:', canCancel);

    // Uncomment this if you want to prevent cancellation after course starts
    // if (!canCancel) {
    //   return res.status(400).json({ 
    //     success: false, 
    //     message: "Cannot cancel enrollment after course has started" 
    //   });
    // }

    // Remove course from user's enrolled courses
    if (isEnrolledInUser) {
      user.enrolledCourses = user.enrolledCourses.filter(
        id => id.toString() !== courseId.toString()
      );
      console.log('Removed course from user.enrolledCourses');
    }

    // Remove user from course's enrolled students
    if (isEnrolledInCourse) {
      course.enrolledStudents = course.enrolledStudents.filter(
        id => id.toString() !== userId.toString()
      );
      console.log('Removed user from course.enrolledStudents');
    }

    // Save both documents
    await user.save();
    await course.save();

    console.log('✅ Enrollment cancelled successfully');
    console.log('=== CANCEL ENROLLMENT END ===');

    res.status(200).json({ 
      success: true, 
      message: "Enrollment cancelled successfully",
      data: {
        courseId,
        userId,
        newEnrollmentCount: course.enrolledStudents.length
      }
    });

  } catch (err) {
    console.error("Cancel enrollment error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to cancel enrollment",
      error: err.message,
    });
  }
},

};

module.exports = courseController;
