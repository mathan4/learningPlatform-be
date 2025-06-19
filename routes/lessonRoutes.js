const express = require("express");
const LessonRouter = express.Router();
const { verifyToken, allowRoles } = require("../middlewares/auth");
const {
  getStudentLessons,
  getMentorLessons,
  getTodayLessons,
  bookLesson,
  cancelLesson,
  getLessonsByCourseId,
} = require("../controllers/lessonController");
const {
  scheduleZoomMeetingAndSave,
  updateLessonWithRecording,
} = require("../controllers/meetingController");

// Student endpoints
LessonRouter.get("/student", verifyToken, allowRoles(["student", "admin"]), getStudentLessons);
LessonRouter.get("/today", verifyToken, allowRoles(["student", "admin"]), getTodayLessons);
LessonRouter.post("/book", verifyToken, allowRoles(["student"]), bookLesson);
LessonRouter.delete("/:id", verifyToken, cancelLesson);

// Mentor endpoints
LessonRouter.get("/mentor", verifyToken, allowRoles(["mentor"]), getMentorLessons);

// Course-based lessons
LessonRouter.get("/course/:courseId", verifyToken, getLessonsByCourseId);

// Get completed lessons for a course
LessonRouter.get("/course/:courseId/completed", verifyToken, async (req, res) => {
  const Lesson = require("../models/lessonPlanModel");
  try {
    const lessons = await Lesson.find({
      courseId: req.params.courseId,
      status: "completed",
      recordingUrl: { $exists: true, $ne: null },
    }).sort({ startTime: 1 });

    res.status(200).json({ success: true, data: lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch completed lessons", error: error.message });
  }
});

// Get upcoming lessons for a course
LessonRouter.get("/course/:courseId/upcoming", verifyToken, async (req, res) => {
  const Lesson = require("../models/lessonPlanModel");
  try {
    const now = new Date();
    const lessons = await Lesson.find({
      courseId: req.params.courseId,
      startTime: { $gte: now },
    }).sort({ startTime: 1 });

    res.status(200).json({ success: true, data: lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch upcoming lessons", error: error.message });
  }
});

// Zoom integration endpoints
LessonRouter.post("/schedule-lesson/:lessonId", verifyToken, async (req, res, next) => {
  try {
    const result = await scheduleZoomMeetingAndSave(req, res);
    if (result?.meetingDetails?.meeting_id && result?.updatedLesson?._id) {
      // Save meeting ID to lesson
      const Lesson = require("../models/lessonPlanModel");
      await Lesson.findByIdAndUpdate(result.updatedLesson._id, {
        meetingId: result.meetingDetails.meeting_id,
      });
    }
  } catch (error) {
    next(error);
  }
});

LessonRouter.post("/update-recording/:lessonId", verifyToken, updateLessonWithRecording);

module.exports = LessonRouter;