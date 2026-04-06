const { Op } = require('sequelize');
const { Student, Internship, Application, Task, Progress, CompanyHR, User, Feedback, Supervisor } = require('../models');

// ==================== VIEW INTERNSHIPS ====================
const viewInternships = async (req, res) => {
    try {
        const { search } = req.query;
        const whereClause = { status: 'open' };

        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
                { location: { [Op.like]: `%${search}%` } }
            ];
        }

        const internships = await Internship.findAll({
            where: whereClause,
            include: [{
                model: CompanyHR,
                include: [{
                    model: User,
                    attributes: ['name', 'email']
                }]
            }],
            order: [['createdAt', 'DESC']]
        });

        // Check if student has applied to each internship
        const student = await Student.findOne({ where: { userId: req.user.id } });
        let appliedInternshipIds = [];
        if (student) {
            const applications = await Application.findAll({
                where: { studentId: student.id },
                attributes: ['internshipId']
            });
            appliedInternshipIds = applications.map(app => app.internshipId);
        }

        const formattedInternships = internships.map(internship => ({
            id: internship.id,
            title: internship.title,
            description: internship.description,
            requirements: internship.requirements,
            location: internship.location,
            duration: internship.duration,
            stipend: internship.stipend,
            positionsAvailable: internship.positionsAvailable,
            deadline: internship.deadline,
            status: internship.status,
            companyName: internship.CompanyHR?.companyName || 'Unknown Company',
            hasApplied: appliedInternshipIds.includes(internship.id),
            createdAt: internship.createdAt
        }));

        return res.status(200).json({
            success: true,
            count: formattedInternships.length,
            data: formattedInternships
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== APPLY FOR INTERNSHIP ====================
const applyForInternship = async (req, res) => {
    try {
        const { internshipId } = req.params;
        const { coverLetter } = req.body;
        const cvPath = req.file ? req.file.path : null;

        // Check if internship exists and is open
        const internship = await Internship.findByPk(internshipId);
        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        if (internship.status !== 'open') {
            return res.status(400).json({ success: false, message: 'This internship is no longer accepting applications' });
        }

        // Check if deadline has passed
        if (new Date(internship.deadline) < new Date()) {
            return res.status(400).json({ success: false, message: 'Application deadline has passed' });
        }

        // Get student
        const student = await Student.findOne({ where: { userId: req.user.id } });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        // Check if already applied
        const existingApplication = await Application.findOne({
            where: {
                studentId: student.id,
                internshipId: internshipId
            }
        });

        if (existingApplication) {
            return res.status(400).json({ success: false, message: 'You have already applied for this internship' });
        }

        // Check if CV is required and uploaded
        if (!cvPath) {
            return res.status(400).json({ success: false, message: 'CV is required' });
        }

        // Create application
        const application = await Application.create({
            studentId: student.id,
            internshipId: internshipId,
            cvPath: cvPath,
            coverLetter: coverLetter || null,
            status: 'pending'
        });

        // Update student status
        await student.update({ internshipStatus: 'applied' });

        return res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: application
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== VIEW APPLICATIONS ====================
const viewApplications = async (req, res) => {
    try {
        const student = await Student.findOne({ where: { userId: req.user.id } });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        const applications = await Application.findAll({
            where: { studentId: student.id },
            include: [{
                model: Internship,
                include: [{
                    model: CompanyHR,
                    include: [{
                        model: User,
                        attributes: ['name', 'email']
                    }]
                }]
            }],
            order: [['createdAt', 'DESC']]
        });

        const formattedApplications = applications.map(app => ({
            id: app.id,
            internshipTitle: app.Internship?.title || 'Unknown',
            companyName: app.Internship?.CompanyHR?.companyName || 'Unknown Company',
            appliedDate: app.appliedDate,
            status: app.status,
            coverLetter: app.coverLetter,
            cvPath: app.cvPath
        }));

        return res.status(200).json({
            success: true,
            count: formattedApplications.length,
            data: formattedApplications
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== VIEW TASKS ====================
const viewTasks = async (req, res) => {
    try {
        const student = await Student.findOne({ where: { userId: req.user.id } });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        const tasks = await Task.findAll({
            where: { studentId: student.id },
            include: [{
                model: Supervisor,
                include: [{
                    model: User,
                    attributes: ['name', 'email']
                }]
            }],
            order: [['deadline', 'ASC']]
        });

        const formattedTasks = tasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            deadline: task.deadline,
            status: task.status,
            supervisorName: task.Supervisor?.User?.name || 'Unknown Supervisor',
            createdAt: task.createdAt
        }));

        return res.status(200).json({
            success: true,
            count: formattedTasks.length,
            data: formattedTasks
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== UPLOAD LEARNING PROGRESS ====================
const uploadProgress = async (req, res) => {
    try {
        const { weekNumber, title, description, taskId } = req.body;
        const filePath = req.file ? req.file.path : null;

        // Validate
        if (!weekNumber || !title || !description) {
            return res.status(400).json({ success: false, message: 'Week number, title and description are required' });
        }

        // Get student
        const student = await Student.findOne({ where: { userId: req.user.id } });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        // Check if student has active internship
        if (student.internshipStatus !== 'active' && student.internshipStatus !== 'selected') {
            return res.status(400).json({ success: false, message: 'No active internship found. You must be selected for an internship to upload progress.' });
        }

        // Check if already uploaded for this week
        const existingProgress = await Progress.findOne({
            where: {
                studentId: student.id,
                weekNumber: weekNumber
            }
        });

        if (existingProgress) {
            return res.status(400).json({ success: false, message: 'Already uploaded progress for this week' });
        }

        // Create progress
        const progress = await Progress.create({
            studentId: student.id,
            taskId: taskId || null,
            weekNumber: parseInt(weekNumber),
            title,
            description,
            filePath: filePath || null,
            status: 'pending'
        });

        return res.status(201).json({
            success: true,
            message: 'Learning progress uploaded successfully',
            data: progress
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== VIEW PROGRESS FEEDBACK ====================
const viewFeedback = async (req, res) => {
    try {
        const student = await Student.findOne({ where: { userId: req.user.id } });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        const feedbacks = await Feedback.findAll({
            where: { studentId: student.id },
            include: [{
                model: Supervisor,
                include: [{
                    model: User,
                    attributes: ['name', 'email']
                }]
            }, {
                model: Progress
            }],
            order: [['createdAt', 'DESC']]
        });

        const formattedFeedbacks = feedbacks.map(fb => ({
            id: fb.id,
            feedbackText: fb.feedbackText,
            rating: fb.rating,
            supervisorName: fb.Supervisor?.User?.name || 'Unknown Supervisor',
            progressTitle: fb.Progress?.title || 'General Feedback',
            weekNumber: fb.Progress?.weekNumber || null,
            createdAt: fb.createdAt
        }));

        return res.status(200).json({
            success: true,
            count: formattedFeedbacks.length,
            data: formattedFeedbacks
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== GET INTERVIEW DETAILS ====================
const getInterviewDetails = async (req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await Application.findOne({
            where: { id: applicationId },
            include: [{
                model: Student,
                where: { userId: req.user.id }
            }]
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const { Shortlist, Interview } = require('../models');

        const shortlist = await Shortlist.findOne({
            where: { applicationId: application.id },
            include: [{
                model: Interview
            }]
        });

        if (!shortlist || !shortlist.Interview) {
            return res.status(404).json({ success: false, message: 'Interview details not found' });
        }

        return res.status(200).json({
            success: true,
            data: shortlist.Interview
        });

    } catch (error) {
        console.error('Error fetching interview details:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    viewInternships,
    applyForInternship,
    viewApplications,
    viewTasks,
    uploadProgress,
    viewFeedback,
    getInterviewDetails
};