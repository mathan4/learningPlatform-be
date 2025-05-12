const express = require("express");
const { createReview, getTutorReviews, getStudentReviews } = require("../controllers/reviewController");
const { verifyToken, allowRoles } = require("../middlewares/auth");
const reviewRouter = express.Router();


// Create a review
reviewRouter.post("/",verifyToken,allowRoles(['student']), createReview);

// Get all reviews for a tutor
reviewRouter.get("/tutor/:tutorId",verifyToken,allowRoles(['admin','student']), getTutorReviews);

// Get all reviews from a student
reviewRouter.get("/student/:studentId",verifyToken,allowRoles(['admin']), getStudentReviews);

module.exports = reviewRouter;
