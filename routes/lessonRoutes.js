const express = require("express");
const LessonRouter = express.Router()
const { verifyToken, allowRoles } = require("../middlewares/auth");
const { getStudentLessons, getMentorLessons, bookLesson, cancelLesson } = require("../controllers/lessonController");

LessonRouter.get("/student", verifyToken,allowRoles(['student','admin']), getStudentLessons);
LessonRouter.get("/mentor", verifyToken,allowRoles(['mentor']), getMentorLessons);
LessonRouter.post("/book", verifyToken,allowRoles(['student']), bookLesson);
LessonRouter.delete("/:id",verifyToken,allowRoles(['student','mentor']), cancelLesson);

module.exports = LessonRouter;
