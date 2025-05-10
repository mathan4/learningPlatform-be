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
   * Creates a Zoom meeting with the given title, start time, duration, and host email and
   * updates the given lesson plan with the meeting link.
   * @param {string} lessonId - The ID of the lesson plan to update
   * @param {string} courseTitle - The title of the course
   * @param {string} startTime - The start time of the meeting in ISO format, e.g. '2025-05-20T10:00:00Z'
   * @param {number} duration - The duration of the meeting in minutes
   * @param {string} hostEmail - The email of the host of the meeting
   * @returns {Promise<Object>} The updated lesson plan with a meeting link
   */
  scheduleLessonWithZoom: async (lessonId, courseTitle, startTime, duration, hostEmail) => {
    try {
      const meetingData = await meeting.createZoomMeeting(courseTitle, startTime, duration, hostEmail);

      // Ensure meeting creation was successful and the join_url exists
      if (!meetingData || !meetingData.join_url) {
        throw new Error("Failed to create Zoom meeting or get meeting link.");
      }

      const updatedLesson = await LessonPlan.findByIdAndUpdate(
        lessonId,
        {
          meetingLink: meetingData.join_url,
        },
        { new: true }
      );

      return updatedLesson;
    } catch (error) {
      console.error("Failed to create Zoom meeting and update lesson:", error.message);
      throw error;
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
   * Updates a lesson plan with a recording URL retrieved from Zoom for the given meeting ID
   * @param {string} lessonId - The ID of the lesson plan to update
   * @param {string} zoomMeetingId - The ID of the Zoom meeting to retrieve recordings for
   * @returns {Promise<Object>} The updated lesson plan with the recording URL
   */
  updateRecordingUrl: async (lessonId, zoomMeetingId) => {
    try {
      const recordingFiles = await meeting.getZoomRecordings(zoomMeetingId);

      // Check if we got valid recording files
      if (!recordingFiles || recordingFiles.length === 0) {
        throw new Error("No recordings found for this meeting.");
      }

      // Extract a recording URL (e.g., first MP4 file)
      const mp4Recording = recordingFiles.find(file => file.file_type === 'MP4');
      const recordingUrl = mp4Recording?.play_url || null;

      if (!recordingUrl) {
        throw new Error("No MP4 recording available.");
      }

      const updatedLesson = await LessonPlan.findByIdAndUpdate(
        lessonId,
        {
          recordingUrl: recordingUrl,
        },
        { new: true }
      );

      return updatedLesson;
    } catch (error) {
      console.error("Failed to update recording URL in lesson:", error.message);
      throw error;
    }
  }
}

module.exports = meeting
