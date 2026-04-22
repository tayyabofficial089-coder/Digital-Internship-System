const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const companyController = require('../controllers/companyController');

// All routes require authentication and company_hr role
router.use(authenticate);
router.use(authorize('company_hr'));

// Post Internship
router.post('/internship', companyController.postInternship);

// View Applications
router.get('/applications', companyController.viewApplications);

// Shortlist Student
router.put('/shortlist/:applicationId', companyController.shortlistStudent);

// Schedule Interview
router.post('/interview', companyController.scheduleInterview);

// Assign Supervisor
router.post('/assign-supervisor', companyController.assignSupervisor);

// Get Supervisors
router.get('/supervisors', companyController.getSupervisors);

// Confirm Completion
router.post('/confirm-completion', companyController.confirmCompletion);

// Select Student
router.put('/select/:applicationId', companyController.selectStudent);

// Reject Student
router.put('/reject/:applicationId', companyController.rejectStudent);

module.exports = router;