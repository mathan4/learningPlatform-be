const Review = require("../models/reviewModel");

const reviewController = {
  /**
   * Creates a review for a lesson and saves it in the database
   * @param {Object} req - Express request object containing `body` with `lessonId`, `studentId`, `tutorId`, `rating`, and `comment`.
   * @param {Object} res - Express response object used to send the response.
   * @returns {Promise<Response>} - A JSON response with the created Review object or an error message.
   * @throws Will throw a 400 error if the student has already reviewed the lesson.
   * @throws Will throw a 500 error if there is an internal server error.
   */
  createReview: async (req, res) => {
    try {
      const { lessonId, studentId, mentorId, rating, comment } = req.body;

      const existingReview = await Review.findOne({ lessonId, studentId });
      if (existingReview) {
        return res
          .status(400)
          .json({ message: "You have already reviewed this lesson." });
      }

      const review = new Review({
        lessonId,
        studentId,
        mentorId,
        rating,
        comment,
      });
      console.log(review);
      try {
        await review.save();
        console.log("saved review");
      } catch (saveError) {
        console.error("Error saving review:", saveError);
        return res
          .status(500)
          .json({ message: "Failed to save review", error: saveError });
      }

      res
        .status(201)
        .json({ message: "Review submitted successfully.", review });
    } catch (error) {
      res.status(500).json({ message: "Error creating review.", error });
    }
  },

  /**
   * Gets all reviews written about a tutor
   * @param {Object} req - Express request object
   * @param {string} req.params.tutorId - The ID of the tutor whose reviews to fetch
   * @param {Object} res - Express response object
   * @returns {Promise<void>} - Resolves with a JSON response containing an array of Review objects, sorted in descending order of creation time
   */
  getTutorReviews: async (req, res) => {
    try {
      const { mentorId } = req.params;
      console.log("Mentor ID:", mentorId);

    
      const reviews = await Review.find({ mentorId: mentorId })
        .populate("studentId", "firstName lastName")
        .populate("mentorId", "firstName lastName")
        .populate("lessonId", "subject")
        .sort({ createdAt: -1 });

      console.log("Found reviews:", reviews.length);
      res.status(200).json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res
        .status(500)
        .json({ message: "Error fetching reviews.", error: error.message });
    }
  },

  /**
   * Gets all reviews written by a student
   * @param {Object} req - Express request object
   * @param {string} req.params.studentId - The ID of the student whose reviews to fetch
   * @param {Object} res - Express response object
   * @returns {Promise<void>} - Resolves with a JSON response containing an array of Review objects
   */
  getStudentReviews: async (req, res) => {
    try {
      const { studentId } = req.params;
      const reviews = await Review.find({ studentId }).populate(
        "tutorId",
        "name"
      );

      res.status(200).json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reviews.", error });
    }
  },
};

module.exports = reviewController;
