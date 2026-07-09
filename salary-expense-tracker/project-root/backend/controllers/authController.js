const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const UserModel = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password } = req.body;

  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const userId = await UserModel.create({ name, email, hashedPassword });
  const token = generateToken(userId);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { id: userId, name, email },
    token
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await UserModel.findByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = generateToken(user.id);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: { id: user.id, name: user.name, email: user.email },
    token
  });
});

// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the protect middleware
  res.status(200).json({ success: true, data: req.user });
});

module.exports = { register, login, getMe };
