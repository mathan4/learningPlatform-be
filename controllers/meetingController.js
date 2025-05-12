const LessonPlan = require("../models/lessonPlanModel");
const { getZoomAccessToken } = require("../utils/zoomService");
const axios = require('axios');

const meeting = {


  /**
   * Creates a Zoom meeting with the given title, start time, duration, and host email
   * @param {string} courseTitle - The title of the course
   * @param {string} startTime - The start time of the meeting in ISO format, e.g. '2025-05-20T10:00:00Z'
   * @param {number} duration - The duration of the meeting in minutes
   * @param {string} hostEmail - The email of the host of the meeting
   * @returns {Promise<Object>} The JSON response from the Zoom API containing the meeting ID and join URL
   */
  createZoomMeeting: async (courseTitle, startTime, duration, hostEmail) => {
    try {
      const token = await getZoomAccessToken();

      const response = await axios.post(
        `https://api.zoom.us/v2/users/${hostEmail}/meetings`,
        {
          topic: courseTitle,
          type: 2, // Scheduled meeting
          start_time: startTime, // ISO format: '2025-05-20T10:00:00Z'
          duration: duration, // in minutes
          timezone: 'UTC',
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            mute_upon_entry: true,
            auto_recording: "cloud",
            waiting_room: false
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating Zoom meeting:', error.response?.data || error.message);
      throw error;
    }
  },



  /**
   * Schedules a Zoom meeting for a lesson and updates the lesson plan in the DB
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {string} lessonId - The ID of the lesson to schedule
   * @param {string} courseTitle - The title of the course
   * @param {string} startTime - The start time of the meeting in ISO format, e.g. '2025-05-20T10:00:00Z'
   * @param {number} duration - The duration of the meeting in minutes
   * @param {string} hostEmail - The email of the host of the meeting
   * @returns {Promise<Response>} The response to the request
   */

  scheduleZoomMeetingAndSave : async (req, res) => {
    const { lessonId } = req.params;
    const { courseTitle, startTime, duration, hostEmail } = req.body;
  
    try {
      const meetingData = await meeting.createZoomMeeting(courseTitle, startTime, duration, hostEmail);
  
      if (!meetingData?.join_url) {
        throw new Error("Failed to create Zoom meeting or get join URL.");
      }
  
      const updatedLesson = await LessonPlan.findByIdAndUpdate(
        lessonId,
        { meetingLink: meetingData.join_url },
        { new: true }
      );
  
      res.status(200).json({
        success: true,
        message: "Lesson scheduled with Zoom meeting.",
        updatedLesson,
      });
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      res.status(500).json({
        success: false,
        message: "Failed to schedule lesson.",
        error: error.message,
      });
    }
  },



  /**
   * Retrieves a list of recording files for a given Zoom meeting ID
   * @param {string} meetingId - The ID of the Zoom meeting to retrieve recordings for
   * @returns {Promise<Object[]>} An array of recording files, each with properties like `file_type`, `file_size`, `recording_start`, `recording_end`, and `play_url`
   */
  getZoomRecordings: async (meetingId) => {
    try {
      const token = await getZoomAccessToken();

      const response = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data.recording_files;
    } catch (error) {
      console.error('Error getting recordings:', error.response?.data || error.message);
      throw error;
    }
  },




/**
 * Updates the lesson plan with the recording URL of a Zoom meeting.
 * 
 * @async
 * @param {Request} req - Express request object containing `params` with `lessonId` and `body` with `zoomMeetingId`.
 * @param {Response} res - Express response object used to send the response.
 * @throws Will throw an error if no recordings are found or if no MP4 recording is available.
 * @returns {Promise<Response>} - A JSON response with the updated lesson if successful or an error message.
 */

  updateLessonWithRecording : async (req, res) => {
    const { lessonId } = req.params;
    const { zoomMeetingId } = req.body;
  
    try {
      const recordingFiles = await meeting.getZoomRecordings(zoomMeetingId);
  
      if (!recordingFiles?.length) {
        throw new Error("No recordings found for this meeting.");
      }
  
      const mp4Recording = recordingFiles.find(file => file.file_type === 'MP4');
      const recordingUrl = mp4Recording?.play_url;
  
      if (!recordingUrl) {
        throw new Error("No MP4 recording available.");
      }
  
      const updatedLesson = await LessonPlan.findByIdAndUpdate(
        lessonId,
        { recordingUrl },
        { new: true }
      );
  
      res.status(200).json({
        success: true,
        message: "Recording URL updated.",
        updatedLesson,
      });
    } catch (error) {
      console.error("Error updating recording URL:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update recording URL.",
        error: error.message,
      });
    }
  }
}

module.exports = meeting

