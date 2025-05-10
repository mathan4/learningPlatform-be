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

      const filter = {};

      if (subject) {
        filter.subjects = { $in: [subject] };
      }

      if (minRate || maxRate) {
        filter.hourlyRate = {};
        if (minRate) filter.hourlyRate.$gte = Number(minRate);
        if (maxRate) filter.hourlyRate.$lte = Number(maxRate);
      }

      if (day) {
        filter['availability.day'] = day;
      }

      const mentors = await Mentor.find(filter)
        .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('userId', 'name email');

      const totalMentors = await Mentor.countDocuments(filter);

      res.json({
        totalPages: Math.ceil(totalMentors / limit),
        currentPage: Number(page),
        mentors,
      });
    } catch (err) {
      console.error('Error fetching tutors:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = mentorController;
