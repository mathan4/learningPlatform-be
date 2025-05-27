const lessonPlanModel = require('../models/lessonPlanModel');
const Mentor = require('../models/mentorProfileModel');

const mentorController = {
  getAllMentors: async (req, res) => {
    try {
      const {
        subject,
        minRate,
        maxRate,
        day,
        page = 1,
        limit = 10,
        sortBy = 'averageRating',
        order = 'desc',
      } = req.query;

      // Validation
      const validSortFields = ['averageRating', 'hourlyRate', 'createdAt', 'firstName', 'lastName'];
      const validOrder = ['asc', 'desc'];
      
      if (!validSortFields.includes(sortBy)) {
        return res.status(400).json({ error: 'Invalid sort field' });
      }
      
      if (!validOrder.includes(order)) {
        return res.status(400).json({ error: 'Invalid sort order' });
      }

      // Validate pagination parameters
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10)); // Cap at 50

      const filter = {};

      // Subject filter
      if (subject && subject.trim()) {
        filter.subjects = { $in: [subject.trim()] };
      }

      // Rate filter with validation
      if (minRate || maxRate) {
        filter.hourlyRate = {};
        
        if (minRate) {
          const minRateNum = parseFloat(minRate);
          if (isNaN(minRateNum) || minRateNum < 0) {
            return res.status(400).json({ error: 'Invalid minimum rate' });
          }
          filter.hourlyRate.$gte = minRateNum;
        }
        
        if (maxRate) {
          const maxRateNum = parseFloat(maxRate);
          if (isNaN(maxRateNum) || maxRateNum < 0) {
            return res.status(400).json({ error: 'Invalid maximum rate' });
          }
          filter.hourlyRate.$lte = maxRateNum;
        }

        // Validate that minRate <= maxRate
        if (minRate && maxRate && parseFloat(minRate) > parseFloat(maxRate)) {
          return res.status(400).json({ error: 'Minimum rate cannot be greater than maximum rate' });
        }
      }

      // Day filter - using elemMatch for array of availability objects
      if (day && day.trim()) {
        filter.availability = { 
          $elemMatch: { 
            day: { $regex: new RegExp(`^${day.trim()}$`, 'i') } 
          } 
        };
      }

      // Build sort object
      let sortObject = {};
      if (sortBy === 'firstName' || sortBy === 'lastName') {
        // For user fields, we need to sort after population
        sortObject[`userId.${sortBy}`] = order === 'asc' ? 1 : -1;
      } else {
        sortObject[sortBy] = order === 'asc' ? 1 : -1;
      }

      // Execute queries
      const [mentors, totalMentors] = await Promise.all([
        Mentor.find(filter)
          .sort(sortObject)
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .populate('userId', 'firstName lastName email')
          .lean(), // Use lean for better performance
        Mentor.countDocuments(filter)
      ]);

      // Handle case where page exceeds total pages
      const totalPages = Math.ceil(totalMentors / limitNum);
      if (pageNum > totalPages && totalPages > 0) {
        return res.status(400).json({ error: 'Page number exceeds total pages' });
      }

      res.json({
        success: true,
        data: {
          totalPages,
          currentPage: pageNum,
          totalMentors,
          limit: limitNum,
          mentors,
        }
      });

    } catch (err) {
      console.error('Error fetching mentors:', err);
      
      // Handle specific MongoDB errors
      if (err.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid data format' });
      }
      
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation error', details: err.message });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Additional helper method for getting mentor subjects (useful for frontend dropdowns)
  getMentorSubjects: async (req, res) => {
    try {
      const subjects = await Mentor.distinct('subjects');
      res.json({
        success: true,
        data: subjects.sort()
      });
    } catch (err) {
      console.error('Error fetching subjects:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  calculateMentorEarnings : async (req, res) => {
  try {
    const completedLessons = await lessonPlanModel.find({
      mentorId: req.userId,
      status: "completed",
    });

    const totalEarnings = completedLessons.reduce((sum, lessonPlanModel) => sum + lessonPlanModel.price, 0);

    res.json({ totalEarnings, completedLessonsCount: completedLessons.length });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}
};

module.exports = mentorController;