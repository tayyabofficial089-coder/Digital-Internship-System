const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

// ==================== AUTH ROUTES ====================

// Student Registration
router.post('/register/student', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('rollNumber').notEmpty().withMessage('Roll number is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').notEmpty().withMessage('Phone number is required')
], authController.registerStudent);

// Company HR Registration
router.post('/register/company', [
    body('companyName').notEmpty().withMessage('Company name is required'),
    body('hrName').notEmpty().withMessage('HR name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').notEmpty().withMessage('Phone number is required')
], authController.registerCompany);

// Supervisor Registration (by Company HR)
router.post('/register/supervisor', [
    authenticate,
    authorize('company_hr'),
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], authController.registerSupervisor);

// Login (All Users)
router.post('/login', authController.login);

// Forgot Password
router.post('/forgot-password', authController.forgotPassword);

// Reset Password
router.post('/reset-password', authController.resetPassword);

module.exports = router;