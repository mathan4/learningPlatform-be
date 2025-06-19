const express = require('express');
const mentorRouter = express.Router();

const { verifyToken, allowRoles } = require('../middlewares/auth');
const {
  getAllMentors,
  getMentorSubjects,
  calculateMentorEarnings,
  getLessonsByCourseId,
} = require('../controllers/mentorController');

// Public or role-restricted mentor routes
mentorRouter.get('/', verifyToken, allowRoles(['admin', 'student']), getAllMentors);
mentorRouter.get('/subjects', getMentorSubjects);
mentorRouter.get('/earnings', verifyToken, allowRoles(['mentor']), calculateMentorEarnings);
mentorRouter.get('/courses/:courseId/lessons', verifyToken, allowRoles(['mentor', 'admin', 'student']), getLessonsByCourseId);

module.exports = mentorRouter;
