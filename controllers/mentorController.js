const mongoose = require("mongoose");
const lessonPlanModel = require("../models/lessonPlanModel");
const Mentor = require("../models/mentorProfileModel");

const mentorController = {
  getAllMentors: async (req, res) => {
    try {
      const {
        subject,
        minRate,
        maxRate,
        day,
        search,
        page = 1,
        limit = 10,
        sortBy = "averageRating",
        order = "desc",
      } = req.query;

      const validSortFields = ["averageRating", "hourlyRate", "createdAt", "firstName", "lastName"];
      const validOrder = ["asc", "desc"];

      if (!validSortFields.includes(sortBy)) {
        return res.status(400).json({ error: "Invalid sort field" });
      }

      if (!validOrder.includes(order)) {
        return res.status(400).json({ error: "Invalid sort order" });
      }

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
      const skip = (pageNum - 1) * limitNum;

      const matchStage = {};

      // Subject filter
      if (subject?.trim()) {
        matchStage.subjects = { $in: [subject.trim()] };
      }

      // Hourly rate filter
      if (minRate || maxRate) {
        matchStage.hourlyRate = {};
        if (minRate) {
          const min = parseFloat(minRate);
          if (isNaN(min) || min < 0) return res.status(400).json({ error: "Invalid minimum rate" });
          matchStage.hourlyRate.$gte = min;
        }
        if (maxRate) {
          const max = parseFloat(maxRate);
          if (isNaN(max) || max < 0) return res.status(400).json({ error: "Invalid maximum rate" });
          matchStage.hourlyRate.$lte = max;
        }
        if (minRate && maxRate && parseFloat(minRate) > parseFloat(maxRate)) {
          return res.status(400).json({ error: "Minimum rate cannot be greater than maximum rate" });
        }
      }

      // Day filter
      if (day?.trim()) {
        matchStage.availability = {
          $elemMatch: {
            day: { $regex: new RegExp(`^${day.trim()}$`, "i") },
          },
        };
      }

      // Search regex
      const searchRegex = search?.trim() ? new RegExp(search.trim(), "i") : null;

      // Sort object
      const sortObject = {};
      if (sortBy === "firstName") sortObject["user.firstName"] = order === "asc" ? 1 : -1;
      else if (sortBy === "lastName") sortObject["user.lastName"] = order === "asc" ? 1 : -1;
      else sortObject[sortBy] = order === "asc" ? 1 : -1;

      // Aggregation pipeline
      const aggregationPipeline = [
        { $match: matchStage },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
      ];

      // Search stage
      if (searchRegex) {
        aggregationPipeline.push({
          $match: {
            $or: [
              { "user.firstName": { $regex: searchRegex } },
              { "user.lastName": { $regex: searchRegex } },
              { subjects: { $regex: searchRegex } },
            ],
          },
        });
      }

      // Count pipeline for total
      const countPipeline = [...aggregationPipeline, { $count: "count" }];
      const countResult = await Mentor.aggregate(countPipeline);
      const totalMentors = countResult[0]?.count || 0;
      const totalPages = Math.ceil(totalMentors / limitNum);

      // Pagination and sorting
      aggregationPipeline.push({ $sort: sortObject });
      aggregationPipeline.push({ $skip: skip });
      aggregationPipeline.push({ $limit: limitNum });

      // Execute main query
      const mentors = await Mentor.aggregate(aggregationPipeline);

      if (pageNum > totalPages && totalPages > 0) {
        return res.status(400).json({ error: "Page number exceeds total pages" });
      }

      res.json({
        success: true,
        data: {
          totalPages,
          currentPage: pageNum,
          totalMentors,
          limit: limitNum,
          mentors,
        },
      });
    } catch (err) {
      console.error("Error fetching mentors:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  getMentorSubjects: async (req, res) => {
    try {
      const subjects = await Mentor.distinct("subjects");
      res.json({
        success: true,
        data: subjects.sort(),
      });
    } catch (err) {
      console.error("Error fetching subjects:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  calculateMentorEarnings: async (req, res) => {
    try {
      const completedLessons = await lessonPlanModel.find({
        mentorId: req.userId,
        status: "completed",
      });

      const totalEarnings = completedLessons.reduce((sum, lesson) => sum + lesson.price, 0);

      res.json({
        totalEarnings,
        completedLessonsCount: completedLessons.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  },
};

module.exports = mentorController;
