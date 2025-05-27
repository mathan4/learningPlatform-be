const MentorRequest = require("../models/mentorRequestModel");
const Mentor = require("../models/mentorProfileModel"); // This is your MentorProfile model
const userModel = require("../models/userModel");

const mentorRequest = {
  submitMentorRequest: async (req, res) => {
    try {
      const filePaths = req.files?.map((file) => file.path) || [];

      // Parse fields that may come as JSON strings (due to multipart/form-data)
      const qualifications = JSON.parse(req.body.qualifications || "[]");
      const subjects = JSON.parse(req.body.subjects || "[]");
      const availability = JSON.parse(req.body.availability || "[]");

      // Check if mentor request already exists for this user
      const existingRequest = await MentorRequest.findOne({
        userId: req.userId,
      });
      if (existingRequest) {
        return res
          .status(400)
          .json({ error: "Mentor request already submitted." });
      }

      // Create a mentor REQUEST (not profile) - this needs approval
      const newRequest = new MentorRequest({
        userId: req.userId,
        qualifications,
        subjects,
        experience: req.body.experience,
        hourlyRate: req.body.hourlyRate,
        bio: req.body.bio,
        availability,
        documents: filePaths,
        status: "pending", // This will be approved/rejected later
      });

      await newRequest.save();
      res
        .status(201)
        .json({
          message: "Mentor request submitted successfully. Awaiting approval.",
        });
    } catch (err) {
      console.error("Error submitting mentor request:", err);
      res
        .status(500)
        .json({ error: "Server error while submitting mentor request." });
    }
  },

  getMentorRequest: async (req, res) => {
    try {
      const requests = await MentorRequest.find().populate("userId", "firstName lastName");
      console.log(requests)
      res.status(200).json(requests);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },

  updateMentorRequestStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      console.log("🔄 Processing request:", id, "with status:", status);

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      // Find the mentor request
      const mentorRequest = await MentorRequest.findById(id);
      if (!mentorRequest) {
        return res.status(404).json({ message: "Mentor request not found" });
      }

      // Update the status
      mentorRequest.status = status;
      await mentorRequest.save();
      console.log("✅ Mentor request status updated");

      // If approved, update user role and add to Mentor collection
      if (status === "approved") {
        console.log("🔄 Processing approval for user:", mentorRequest.userId);
        const userId=mentorRequest.userId.toString();
        // 1. Update User role
        const user = await userModel.findById(userId);
        console.log(user)
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        console.log(user)
        user.role = "mentor";
        await user.save();
        console.log("✅ User role updated to mentor");

        // 2. Convert time format correctly
        const convertTo24Hour = (time12h) => {
          console.log("Converting time:", time12h);
          const [time, modifier] = time12h.split(" ");
          let [hours, minutes] = time.split(":");
          hours = parseInt(hours, 10);

          if (modifier === "AM") {
            if (hours === 12) {
              hours = 0; // 12:00 AM = 00:00
            }
          } else if (modifier === "PM") {
            if (hours !== 12) {
              hours += 12; // 1:00 PM = 13:00, but 12:00 PM stays 12:00
            }
          }

          const result = `${hours.toString().padStart(2, "0")}:${minutes}`;
          console.log("Converted", time12h, "to", result);
          return result;
        };

        // Process availability to convert time format
        const processedAvailability = mentorRequest.availability.map(
          (slot) => ({
            day: slot.day,
            startTime: convertTo24Hour(slot.startTime),
            endTime: convertTo24Hour(slot.endTime),
          })
        );

        console.log("✅ Processed availability:", processedAvailability);

        // Create mentor profile data
        const mentorProfileData = {
          userId: user._id,
          qualifications: mentorRequest.qualifications,
          subjects: mentorRequest.subjects,
          experience: mentorRequest.experience,
          hourlyRate: mentorRequest.hourlyRate,
          bio: mentorRequest.bio,
          availability: processedAvailability,
          // Add default values for required fields
          averageRating: 0,
          totalReviews: 0,
          isActive: true,
        };

        console.log(
          "📝 Creating mentor profile with data:",
          JSON.stringify(mentorProfileData, null, 2)
        );

        try {
          // Create the mentor profile
          const newMentor = await Mentor.create(mentorProfileData);
          console.log("✅ Mentor profile created successfully:", newMentor._id);
        } catch (mentorError) {
          console.error("❌ Detailed mentor creation error:", {
            message: mentorError.message,
            name: mentorError.name,
            errors: mentorError.errors,
          });

          // Rollback user role change
          user.role = "user";
          await user.save();
          console.log("🔄 Rolled back user role change");

          return res.status(500).json({
            message: "Error creating mentor profile",
            error: mentorError.message,
            details: mentorError.errors,
          });
        }
      }

      // Delete the mentor request after processing
      await mentorRequest.deleteOne();
      console.log("✅ Mentor request deleted");

      res.status(200).json({
        message: `Mentor request ${status} successfully`,
      });
    } catch (error) {
      console.error("❌ Main error updating mentor request status:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  },
};

module.exports = mentorRequest;
