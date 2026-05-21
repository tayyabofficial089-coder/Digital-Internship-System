const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Get All Users
router.get('/users', adminController.getAllUsers);

// Approve User
router.put('/users/:userId/approve', adminController.approveUser);

// Reject User
router.put('/users/:userId/reject', adminController.rejectUser);

// Block User
router.put('/users/:userId/block', adminController.blockUser);

// Unblock User
router.put('/users/:userId/unblock', adminController.unblockUser);

// Delete User
router.delete('/users/:userId', adminController.deleteUser);

// Get Internships for Verification
router.get('/internships/verify', adminController.getInternshipsForVerification);

// Verify Internship
router.put('/internships/:internshipId/verify', adminController.verifyInternship);

// Generate Report
router.get('/reports/:type', adminController.generateReport);

module.exports = router;