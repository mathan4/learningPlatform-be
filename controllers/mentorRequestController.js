const MentorRequest = require("../models/mentorRequestModel");
const Mentor = require("../models/mentorProfileModel"); 

const mentorRequest={
    submitMentorRequest : async (req, res) => {
        try {
          const filePaths = req.files?.map((file) => file.path) || [];
      
          const existingRequest = await MentorRequest.findOne({
            userId: req.userId,
          });
          if (existingRequest) {
            return res.status(400).json({ error: "Mentor request already submitted." });
          }
      
          const newRequest = new MentorRequest({
            userId: req.userId,
            qualifications: req.body.qualifications, // make sure frontend sends this correctly (as JSON if nested)
            subjects: req.body.subjects, // ideally also parse array/json from string if needed
            experience: req.body.experience,
            hourlyRate: req.body.hourlyRate,
            bio: req.body.bio,
            availability: req.body.availability,
            documents: filePaths,
          });
      
          await newRequest.save();
          res.status(201).json({ message: "Mentor request submitted successfully." });
        } catch (err) {
          console.error(err);
          res.status(500).json({ error: "Server error" });
        }
      },
      
      getMentorRequest:async(req, res) => {
        try {
          const requests = await MentorRequest.find();
          res.status(200).json(requests);
        } catch (err) {
          console.error(err);
          res.status(500).json({ error: "Server error" });
        }
      },

      updateMentorRequestStatus: async (req, res) => {
        try {
          const { requestId } = req.params;
          const { status } = req.body;
      
          if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
          }
      
          // Find the mentor request
          const mentorRequest = await MentorRequest.findById(requestId);
          if (!mentorRequest) {
            return res.status(404).json({ message: "Mentor request not found" });
          }
      
          // Update the status
          mentorRequest.status = status;
          await mentorRequest.save();
      
          // If approved, update user role and add to Mentor collection
          if (status === "approved") {
            // 1. Update User role
            const user = await User.findById(mentorRequest.userId);
            if (!user) {
              return res.status(404).json({ message: "User not found" });
            }
            user.role = "mentor";
            await user.save();
      
            // 2. Save mentor profile
            const newMentor = new Mentor({
              userId: user._id,
              name: user.name,
              email: user.email,
              qualifications: mentorRequest.qualifications,
              subjects: mentorRequest.subjects,
              experience: mentorRequest.experience,
              hourlyRate: mentorRequest.hourlyRate,
              bio: mentorRequest.bio,
              availability: mentorRequest.availability,
              documents: mentorRequest.documents,
            });
      
            await newMentor.save();
          }
      
          res.status(200).json({
            message: `Mentor request ${status} successfully`,
          });
        } catch (error) {
          console.error("Error updating mentor request status:", error);
          res.status(500).json({ message: "Server error" });
        }
      }

}



module.exports = mentorRequest
