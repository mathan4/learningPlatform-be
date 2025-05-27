const User = require("../models/userModel");

const userController = {
  getUser: async (req, res) => {
    try {
      // get the userId from the request object
      const userId = req.userId;

      // find the user in the database
      const user = await User.findById(userId).select("-password -__v");

      // if user not found, return 404
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // return the user data
      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find().select("-password -__v");

      if (!users || users.length === 0) {
        return res.status(404).json({ message: "No users found" });
      }

      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  },
  updateProfile: async (req, res) => {
    try {
      const userId = req.userId;
      const { firstName, lastName, location, languagesKnown } = req.body;

      if (!firstName || !lastName || !location || !languagesKnown) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Handle languagesKnown as JSON string
      let parsedLanguages;
      try {
        parsedLanguages = JSON.parse(languagesKnown);
      } catch (error) {
        return res
          .status(400)
          .json({ message: "Invalid languagesKnown format" });
      }

      // Build update object
      const updateData = {
        firstName,
        lastName,
        location,
        languagesKnown: parsedLanguages,
      };

      // Handle profilePicture if provided
      if (req.file) {
        // e.g., save filename or URL (if using cloud storage)
        const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
          req.file.filename
        }`;
        updateData.profilePicture = fileUrl;
      }

      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({
        message: "Profile update failed",
        error: error.message,
      });
    }
  },
  deleteUserById: async (req, res) => {
    try {
      const userId = req.userId;

      // Validate ID
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Find and delete user
      const deletedUser = await User.findByIdAndDelete(userId);

      if (!deletedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = userController;
