const Lesson = require("../models/lessonPlanModel");
const Course = require("../models/courseModel");
const { scheduleZoomMeetingAndSave } = require("./meetingController");

/**
 * Automatically creates lesson plans for a student enrolled in a course
 * and schedules Zoom meetings for each class.
 */
const createLessonsForCourseStudent = async (courseId, studentId) => {
  const course = await Course.findById(courseId).populate("mentorId");
  if (!course) throw new Error("Course not found");

  const { daysOfWeek, classTime, sessionDuration } = course.schedule;
  const { startDate, endDate } = course.timeline;

  const dayMap = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6,
  };

  const classDays = daysOfWeek.map(day => dayMap[day]);

  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    if (classDays.includes(current.getDay())) {
      const [startH, startM] = classTime.startTime.split(":").map(Number);
      const startTime = new Date(current);
      startTime.setHours(startH, startM, 0, 0);

      const endTime = new Date(startTime.getTime() + sessionDuration * 60000);

      const lesson = await Lesson.create({
        mentorId: course.mentorId._id,
        studentId,
        subject: course.subject,
        title: `${course.title} - Class`,
        description: course.description,
        startTime,
        endTime,
        price: 0,
        status: "scheduled",
        courseId: course._id,
      });

      // Schedule Zoom meeting
      await scheduleZoomMeetingAndSave(
        { params: { lessonId: lesson._id }, userId: studentId },
        { json: () => {}, status: () => ({ json: () => {} }) }
      );
    }
    current.setDate(current.getDate() + 1);
  }
};

module.exports = createLessonsForCourseStudent;