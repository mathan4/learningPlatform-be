const User = require('../models/userModel');


const userController={

    getUser: async (req, res) => {
        try {
            // get the userId from the request object
            const userId = req.userId;

            // find the user in the database
            const user = await User.findById(userId).select('-password -__v');

            // if user not found, return 404
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // return the user data
            return res.status(200).json(user);
        } catch (error) {
            return res.status(500).json({ message: 'Internal server error' });
        }
    },
    getAllUsers: async (req, res) => {
        try {
            const users = await User.find().select('-password -__v');

            if (!users || users.length === 0) {
                return res.status(404).json({ message: 'No users found' });
            }

            return res.status(200).json(users);
        } catch (error) {
            return res.status(500).json({ message: 'Internal server error' });
        }
    },
    updateProfile: async (req, res) => {
        try {
            const userId = req.userId;
            const { languagesKnown, location } = req.body;
    
            if (!languagesKnown || !location) {
                return res.status(400).json({ message: 'All fields are required' });
            }
    
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { languagesKnown, location },
                { new: true } // Return the updated document
            );
    
            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            return res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Profile update failed', error });
        }
    },
    deleteUserById: async (req, res) => {
        try {
            const userId  = req.userId;
    
            // Validate ID
            if (!userId) {
                return res.status(400).json({ message: 'User ID is required' });
            }
    
            // Find and delete user
            const deletedUser = await User.findByIdAndDelete(userId);
    
            if (!deletedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            return res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    
   
}

module.exports=userController