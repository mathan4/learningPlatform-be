const express = require('express');
const meetingRouter = express.Router();
const { scheduleLessonWithZoom, updateRecordingUrl } = require('../controllers/meetingController');
const LessonPlan = require('../models/lessonPlanModel');

// Route to create a Zoom meeting and update the lesson plan with the meeting link
meetingRouter.post('/schedule-lesson/:lessonId', async (req, res) => {
  const { lessonId } = req.params;
  const { courseTitle, startTime, duration, hostEmail } = req.body;

  try {
    const updatedLesson = await scheduleLessonWithZoom(lessonId, courseTitle, startTime, duration, hostEmail);
    res.status(200).json({
      success: true,
      message: 'Lesson scheduled with Zoom meeting link.',
      updatedLesson,
    });
  } catch (error) {
    console.error("Error scheduling lesson:", error);
    res.status(500).json({
      success: false,
      message: "Error scheduling lesson with Zoom meeting.",
      error: error.message,
    });
  }
});

// Route to update the recording URL of a lesson after the Zoom meeting has ended and recordings are available
meetingRouter.post('/update-recording/:lessonId', async (req, res) => {
  const { lessonId } = req.params;
  const { zoomMeetingId } = req.body;

  try {
    const updatedLesson = await updateRecordingUrl(lessonId, zoomMeetingId);
    res.status(200).json({
      success: true,
      message: 'Recording URL updated in lesson plan.',
      updatedLesson,
    });
  } catch (error) {
    console.error("Error updating recording URL:", error);
    res.status(500).json({
      success: false,
      message: "Error updating recording URL in lesson plan.",
      error: error.message,
    });
  }
});

module.exports = meetingRouter
