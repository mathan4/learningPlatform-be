const {createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse, getMentorCourse, enrollInCourse} = require('../controllers/courseController');
const { verifyToken, allowRoles } = require('../middlewares/auth');
const express = require("express");
const uploadDocuments = require('../middlewares/uploadDocuments');
const courseRouter = express.Router()

courseRouter.post('/create', verifyToken,uploadDocuments.single('coverImage'),allowRoles(['mentor']), createCourse);
courseRouter.get('/',verifyToken, getAllCourses);
courseRouter.get('/:id',verifyToken, getCourseById);
courseRouter.get('/mentor',verifyToken,allowRoles(['mentor']), getMentorCourse);
courseRouter.put('/:id', verifyToken, updateCourse);
courseRouter.delete('/:id', verifyToken, deleteCourse);
courseRouter.post('/:courseId/enroll',verifyToken , enrollInCourse);

module.exports = courseRouter;
