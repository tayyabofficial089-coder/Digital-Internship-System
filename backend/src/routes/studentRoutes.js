const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const studentController = require('../controllers/studentController');
const upload = require('../middleware/upload');

// All routes require authentication and student role
router.use(authenticate);
router.use(authorize('student'));

// View Internships
router.get('/internships', studentController.viewInternships);

// Apply for Internship (with CV upload)
router.post('/apply/:internshipId',
    upload.single('cv'),
    studentController.applyForInternship
);

// View Applications
router.get('/applications', studentController.viewApplications);

// View Tasks
router.get('/tasks', studentController.viewTasks);

// View Interview Details
router.get('/interview/:applicationId', studentController.getInterviewDetails);

// Upload Learning Progress
router.post('/progress',
    upload.single('file'),
    studentController.uploadProgress
);

// View Feedback
router.get('/feedback', studentController.viewFeedback);

module.exports = router;