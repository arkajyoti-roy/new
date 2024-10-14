const bcrypt = require('bcrypt');
const UserModel = require("../Models/User");
const jwt = require('jsonwebtoken');

const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if the user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists", success: false });
        }

        // Create a new user
        const userModel = new UserModel({ name, email, password: await bcrypt.hash(password, 10) });
        await userModel.save();

        res.status(201).json({
            message: "Signup successful!",
            success: true
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({
            message: "Something went wrong",
            success: false,
            error: error.message // Return error message for debugging (optional)
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the user exists
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User does not exist", success: false });
        }

        // Check if the password is correct
        const isPassEqual = await bcrypt.compare(password, user.password);
        if (!isPassEqual) {
            return res.status(403).json({ message: "Invalid password", success: false });
        }

        // Generate JWT token
        const jwtToken = jwt.sign({ email: user.email, _id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Send the response with user data
        res.status(200).json({
            message: "Login successful!",
            success: true,
            jwtToken,
            email: user.email, // Use user email from database
            name: user.name // Use user name from database
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({
            message: "Something went wrong",
            success: false,
            error: error.message // Return error message for debugging (optional)
        });
    }
};

module.exports = {
    signup,
    login
};
