const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../utils/config');


const authController = {
    register: async (req, res) => {
        try {
            const { firstName, lastName, email, password } = req.body;
    
            // validate input
            if (!firstName || !lastName || !email || !password ) {
                return res.status(400).json({ message: 'All fields are required' });
            }
    
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }
    
            const hashedPassword = await bcrypt.hash(password, 10);
    
            const newUser = new User({
                firstName,
                lastName,
                email,
                password: hashedPassword,
            });
    
            await newUser.save();
    
            return res.status(201).json({ message: 'User registered successfully' });
        } catch (error) {
            return res.status(500).json({ message: 'Registration failed', error });
        }
    },    
    login: async (req, res) => {
        try {
            // get the details from the request body
            const { email, password } = req.body;

            // validate input
            if (!email || !password) {
                return res.status(400).json({ message: 'All fields are required' });
            }

            // check if user exists
            const existingUser = await User.findOne({ email });

            if (!existingUser) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // check if password is correct
            const isPasswordValid = await bcrypt.compare(password, existingUser.password);

            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // create a JWT token
            const token = jwt.sign({ id: existingUser._id }, JWT_SECRET, { expiresIn: '8h' });

            // set the token in a cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'None',
                maxAge: 28800000 // 8 hours
            });

            // send response
            return res.status(200).json({ message: 'Login successful' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Login failed',error });
           
        }
    },
    logout: async (req, res) => {
        try {
            // clear the cookie
            res.clearCookie('token');

            // send response
            return res.status(200).json({ message: 'Logout successful' });
        } catch (error) {
            return res.status(500).json({ message: 'Logout failed' });
        }
    },
    me: async (req, res) => {
        try {
            const userId = req.userId;

            // find the user by ID
            const user = await User.findById(userId).select('-password -__v');

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // send response
            return res.status(200).json(user);
        } catch (error) {
            return res.status(500).json({ message: 'Failed to retrieve user' });
        }
    }
}

module.exports = authController;
