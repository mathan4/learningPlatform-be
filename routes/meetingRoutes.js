const express = require('express');
const meetingRouter = express.Router();
const { scheduleZoomMeetingAndSave, updateLessonWithRecording } = require('../controllers/meetingController');

// Route to create a Zoom meeting and update the lesson plan with the meeting link
meetingRouter.post('/schedule-lesson/:lessonId',scheduleZoomMeetingAndSave);

// Route to update the recording URL of a lesson after the Zoom meeting has ended and recordings are available
meetingRouter.post('/update-recording/:lessonId', updateLessonWithRecording);

module.exports = meetingRouter
