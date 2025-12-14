const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validateUsername = require('../middleware/validateUsername');

// Check username availability
router.get('/check/:username', authController.checkUsername);

// Register or login
router.post('/login', validateUsername, authController.registerOrLogin);

// Get user profile
router.get('/profile/:username', authController.getUserProfile);

module.exports = router;