const { Supervisor, Student, User, Task, Progress, Feedback, CompanyHR } = require('../models');

// ==================== VIEW ASSIGNED STUDENTS ====================
const viewAssignedStudents = async (req, res) => {
    try {
        const supervisor = await Supervisor.findOne({
            where: { userId: req.user.id },
            include: [{
                model: CompanyHR
            }]
        });

        if (!supervisor) {
            return res.status(404).json({ success: false, message: 'Supervisor profile not found' });
        }

        const students = await Student.findAll({
            where: { supervisorId: supervisor.id },
            include: [{
                model: User,
                attributes: ['id', 'name', 'email']
            }]
        });

        const formattedStudents = students.map(student => ({
            id: student.id,
            name: student.User?.name || 'Unknown Student',
            email: student.User?.email || 'Unknown',
            rollNumber: student.rollNumber,
            department: student.department,
            semester: student.semester,
            cgpa: student.cgpa,
            internshipStatus: student.internshipStatus,
            createdAt: student.createdAt
        }));

        return res.status(200).json({
            success: true,
            count: formattedStudents.length,
            data: formattedStudents
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== ASSIGN TASK TO STUDENT ====================
const assignTask = async (req, res) => {
    try {
        const { studentId, title, description, deadline } = req.body;

        if (!studentId || !title || !description || !deadline) {
            return res.status(400).json({ success: false, message: 'Student ID, title, description and deadline are required' });
        }

        // Get supervisor
        const supervisor = await Supervisor.findOne({ where: { userId: req.user.id } });
        if (!supervisor) {
            return res.status(404).json({ success: false, message: 'Supervisor profile not found' });
        }

        // Check if student is assigned to this supervisor
        const student = await Student.findOne({
            where: {
                id: studentId,
                supervisorId: supervisor.id
            }
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found or not assigned to you' });
        }

        // Check deadline
        if (new Date(deadline) < new Date()) {
            return res.status(400).json({ success: false, message: 'Deadline cannot be in the past' });
        }

        // Create task
        const task = await Task.create({
            supervisorId: supervisor.id,
            studentId: student.id,
            title,
            description,
            deadline: new Date(deadline),
            status: 'pending'
        });

        return res.status(201).json({
            success: true,
            message: 'Task assigned successfully',
            data: task
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== VIEW STUDENT PROGRESS ====================
const viewStudentProgress = async (req, res) => {
    try {
        const { studentId } = req.params;

        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Student ID is required' });
        }

        const supervisor = await Supervisor.findOne({ where: { userId: req.user.id } });
        if (!supervisor) {
            return res.status(404).json({ success: false, message: 'Supervisor profile not found' });
        }

        // Check if student is assigned to this supervisor
        const student = await Student.findOne({
            where: {
                id: studentId,
                supervisorId: supervisor.id
            },
            include: [{
                model: User,
                attributes: ['name', 'email']
            }]
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found or not assigned to you' });
        }

        const progressList = await Progress.findAll({
            where: { studentId: student.id },
            include: [{
                model: Task,
                attributes: ['title', 'description']
            }],
            order: [['weekNumber', 'ASC']]
        });

        const formattedProgress = progressList.map(progress => ({
            id: progress.id,
            weekNumber: progress.weekNumber,
            title: progress.title,
            description: progress.description,
            filePath: progress.filePath,
            status: progress.status,
            taskTitle: progress.Task?.title || 'No Task',
            createdAt: progress.createdAt
        }));

        return res.status(200).json({
            success: true,
            student: {
                id: student.id,
                name: student.User?.name || 'Unknown',
                email: student.User?.email || 'Unknown',
                rollNumber: student.rollNumber
            },
            count: formattedProgress.length,
            data: formattedProgress
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== GIVE FEEDBACK ====================
const giveFeedback = async (req, res) => {
    try {
        const { studentId, progressId, feedbackText, rating } = req.body;

        if (!studentId || !feedbackText) {
            return res.status(400).json({ success: false, message: 'Student ID and feedback text are required' });
        }

        const supervisor = await Supervisor.findOne({ where: { userId: req.user.id } });
        if (!supervisor) {
            return res.status(404).json({ success: false, message: 'Supervisor profile not found' });
        }

        // Check if student is assigned to this supervisor
        const student = await Student.findOne({
            where: {
                id: studentId,
                supervisorId: supervisor.id
            }
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found or not assigned to you' });
        }

        // Check if progress exists (if provided)
        if (progressId) {
            const progress = await Progress.findOne({
                where: {
                    id: progressId,
                    studentId: student.id
                }
            });

            if (!progress) {
                return res.status(404).json({ success: false, message: 'Progress not found for this student' });
            }

            // Update progress status
            await progress.update({ status: 'reviewed' });
        }

        // Create feedback
        const feedback = await Feedback.create({
            supervisorId: supervisor.id,
            studentId: student.id,
            progressId: progressId || null,
            feedbackText,
            rating: rating || null
        });

        return res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: feedback
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== GET ALL FEEDBACK FOR STUDENT ====================
const getAllFeedback = async (req, res) => {
    try {
        const { studentId } = req.params;

        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Student ID is required' });
        }

        const supervisor = await Supervisor.findOne({ where: { userId: req.user.id } });
        if (!supervisor) {
            return res.status(404).json({ success: false, message: 'Supervisor profile not found' });
        }

        // Check if student is assigned to this supervisor
        const student = await Student.findOne({
            where: {
                id: studentId,
                supervisorId: supervisor.id
            }
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found or not assigned to you' });
        }

        const feedbacks = await Feedback.findAll({
            where: {
                studentId: student.id,
                supervisorId: supervisor.id
            },
            include: [{
                model: Progress,
                attributes: ['weekNumber', 'title']
            }],
            order: [['createdAt', 'DESC']]
        });

        const formattedFeedbacks = feedbacks.map(fb => ({
            id: fb.id,
            feedbackText: fb.feedbackText,
            rating: fb.rating,
            weekNumber: fb.Progress?.weekNumber || 'General',
            progressTitle: fb.Progress?.title || 'General Feedback',
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

// ==================== SUBMIT EVALUATION ====================
const submitEvaluation = async (req, res) => {
    try {
        const { studentId, internshipId, rating, strengths, weaknesses, comments, finalStatus } = req.body;

        if (!studentId || !internshipId || !rating) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const supervisor = await Supervisor.findOne({ where: { userId: req.user.id } });
        if (!supervisor) {
            return res.status(404).json({ success: false, message: 'Supervisor profile not found' });
        }

        // Check if student is assigned to this supervisor
        const student = await Student.findOne({
            where: {
                id: studentId,
                supervisorId: supervisor.id
            }
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found or not assigned to you' });
        }

        // Create Evaluation
        const { Evaluation } = require('../models');
        const evaluation = await Evaluation.create({
            supervisorId: supervisor.id,
            studentId,
            internshipId,
            rating,
            strengths,
            weaknesses,
            comments,
            finalStatus: finalStatus || 'passed'
        });

        return res.status(201).json({
            success: true,
            message: 'Final evaluation submitted successfully',
            data: evaluation
        });

    } catch (error) {
        console.error('Error submitting evaluation:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    viewAssignedStudents,
    assignTask,
    viewStudentProgress,
    giveFeedback,
    getAllFeedback,
    submitEvaluation
};