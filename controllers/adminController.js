// Example implementations

const Course = require('../models/courseModel');
const User = require('../models/userModel');

const getAllCourses = async (req, res) => {
  const courses = await Course.find().populate('mentorId', 'name email');
  res.json(courses);
};

const deleteCourseById = async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.json({ message: 'Course deleted successfully' });
};

const getSiteStats = async (req, res) => {
  const userCount = await User.countDocuments();
  const mentorCount = await User.countDocuments({ role: 'mentor' });
  const courseCount = await Course.countDocuments();
  res.json({ userCount, mentorCount, courseCount });
};

module.exports={getAllCourses,deleteCourseById,getSiteStats}