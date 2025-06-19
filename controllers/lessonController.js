const lessonPlanModel = require("../models/lessonPlanModel");
const Lesson = require("../models/lessonPlanModel");
const mentorProfileModel = require("../models/mentorProfileModel");
const { scheduleZoomMeetingAndSave } = require("./meetingController");

const lessonController = {
  // GET /lessons/student
  getStudentLessons: async (req, res) => {
    try {
      const lessons = await Lesson.find({ studentId: req.userId })
        .populate("mentorId", "firstName email hourlyRate")
        .populate("courseId", "title subject")
        .sort({ startTime: 1 });

      res.status(200).json({ success: true, data: lessons });
    } catch (err) {
      console.error("getStudentLessons error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch lessons." });
    }
  },

  // GET /lessons/mentor
  getMentorLessons: async (req, res) => {
    try {
      const lessons = await Lesson.find({ mentorId: req.userId })
        .populate("studentId", "firstName lastName email")
        .populate("courseId", "title subject")
        .sort({ startTime: 1 });

      res.status(200).json({ success: true, data: lessons });
    } catch (err) {
      console.error("getMentorLessons error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch mentor's lessons." });
    }
  },

  // GET /lessons/today
  getTodayLessons: async (req, res) => {
    try {
      const userId = req.userId;
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const lessons = await Lesson.find({
        studentId: userId,
        startTime: { $gte: startOfDay, $lte: endOfDay },
      })
        .populate("mentorId", "firstName email")
        .populate("courseId", "title subject")
        .sort({ startTime: 1 });

      res.status(200).json({ success: true, data: lessons });
    } catch (err) {
      console.error("getTodayLessons error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch today's lessons." });
    }
  },

  // GET /lessons/course/:courseId
  getLessonsByCourseId: async (req, res) => {
    try {
      const courseId = req.params.courseId;

      const lessons = await Lesson.find({ courseId })
        .populate("mentorId", "firstName lastName email")
        .populate("studentId", "firstName lastName email")
        .sort({ startTime: 1 });

      res.status(200).json({ success: true, data: lessons });
    } catch (err) {
      console.error("getLessonsByCourseId error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch course lessons." });
    }
  },

  // POST /lessons/book
  bookLesson: async (req, res) => {
    const { mentorId, subject, date, time, courseId } = req.body;

    try {
      const startTime = new Date(`${date}T${time}`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      const mentorProfile = await mentorProfileModel.findById(mentorId);

      if (!mentorProfile) {
        return res.status(404).json({ success: false, message: "Mentor profile not found." });
      }

      const userId = mentorProfile.userId;

      const lesson = new Lesson({
        mentorId: userId,
        studentId: req.userId,
        subject,
        startTime,
        endTime,
        title: `${subject} Lesson`,
        price: mentorProfile.hourlyRate,
        status: "scheduled",
        courseId: courseId || null,
      });

      await lesson.save();

      // Auto schedule Zoom meeting
      const reqMock = { params: { lessonId: lesson._id }, userId: req.userId };
      const resMock = {
        status: () => ({ json: () => {} }),
        json: () => {},
      };

      await scheduleZoomMeetingAndSave(reqMock, resMock);

      const updatedLesson = await Lesson.findById(lesson._id);

      res.status(201).json({ success: true, data: updatedLesson });
    } catch (err) {
      console.error("bookLesson error:", err);
      res.status(400).json({ success: false, message: "Booking failed." });
    }
  },

  // DELETE /lessons/:id
  cancelLesson: async (req, res) => {
    try {
      const lessonId = req.params.id;
      const lesson = await Lesson.findById(lessonId);

      if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });

      await Lesson.findByIdAndDelete(lessonId);
      res.status(200).json({ success: true, message: "Lesson canceled" });
    } catch (err) {
      console.error("cancelLesson error:", err);
      res.status(500).json({ success: false, message: "Failed to cancel lesson" });
    }
  },
};

module.exports = lessonController;