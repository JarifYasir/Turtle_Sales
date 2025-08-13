const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// @desc    Register user
// @route   POST /api/v1/register
// @access  Public
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        msg: "User already exists with this email",
      });
    }

    const user = new User({
      name,
      email,
      password,
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      msg: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({
      success: false,
      msg: "Server error during registration",
    });
  }
};

// @desc    Login user
// @route   POST /api/v1/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "Bad credentials",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        msg: "Bad password",
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      success: false,
      msg: "Server error during login",
    });
  }
};

// @desc    Get user dashboard data
// @route   GET /api/v1/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/update-profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name } = req.body;
    const userId = req.user.id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    res.json({
      success: true,
      msg: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    res.status(500).json({
      success: false,
      msg: "Server error during profile update",
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/v1/delete-account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    res.json({
      success: true,
      msg: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error.message);
    res.status(500).json({
      success: false,
      msg: "Server error during account deletion",
    });
  }
};

// @desc    Logout user
// @route   POST /api/v1/logout
// @access  Private
const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      msg: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({
      success: false,
      msg: "Server error during logout",
    });
  }
};

// IMPORTANT: Make sure all functions are exported
module.exports = {
  register,
  login,
  getDashboard,
  updateProfile, // Make sure this is included
  deleteAccount,
  logout,
};
