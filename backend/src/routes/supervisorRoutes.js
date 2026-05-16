const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const supervisorController = require('../controllers/supervisorController');

// All routes require authentication and supervisor role
router.use(authenticate);
router.use(authorize('supervisor'));

// View Assigned Students
router.get('/students', supervisorController.viewAssignedStudents);

// Assign Task to Student
router.post('/task', supervisorController.assignTask);

// View Student Progress
router.get('/progress/:studentId', supervisorController.viewStudentProgress);

// Give Feedback
router.post('/feedback', supervisorController.giveFeedback);

// Get All Feedback for a Student
router.get('/feedback/:studentId', supervisorController.getAllFeedback);

// Submit Final Evaluation
router.post('/evaluation', supervisorController.submitEvaluation);

module.exports = router;