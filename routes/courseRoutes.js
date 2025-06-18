const {createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse, getMentorCourse, enrollInCourse, getEnrolledCourses, cancelEnrollment} = require('../controllers/courseController');
const { verifyToken, allowRoles } = require('../middlewares/auth');
const express = require("express");
const uploadDocuments = require('../middlewares/uploadDocuments');
const courseRouter = express.Router()

courseRouter.post('/create', verifyToken, uploadDocuments.single('coverImage'), allowRoles(['mentor']), createCourse);
courseRouter.get('/enrolledCourses', verifyToken, getEnrolledCourses); // move this up
courseRouter.get('/mentor', verifyToken, allowRoles(['mentor']), getMentorCourse);
courseRouter.get('/', verifyToken, getAllCourses);
courseRouter.get('/:id', verifyToken, getCourseById); // keep dynamic last
courseRouter.put('/:id', verifyToken, updateCourse);
courseRouter.delete('/:id', verifyToken, deleteCourse);
courseRouter.post('/enroll/:courseId', verifyToken, enrollInCourse);
courseRouter.delete('/enroll/:courseId', verifyToken, cancelEnrollment);

module.exports = courseRouter;
