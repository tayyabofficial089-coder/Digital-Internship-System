const { Op } = require('sequelize');
const { CompanyHR, Internship, Application, Student, User, Supervisor, Shortlist, Interview } = require('../models');

// ==================== POST INTERNSHIP ====================
const postInternship = async (req, res) => {
    try {
        const { title, description, requirements, location, duration, stipend, positionsAvailable, deadline } = req.body;

        // Validate
        if (!title || !description || !deadline) {
            return res.status(400).json({ success: false, message: 'Title, description and deadline are required' });
        }

        // Get company
        const company = await CompanyHR.findOne({ where: { userId: req.user.id } });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company profile not found' });
        }

        // Check deadline
        if (new Date(deadline) < new Date()) {
            return res.status(400).json({ success: false, message: 'Deadline cannot be in the past' });
        }

        // Create internship
        const internship = await Internship.create({
            companyHRId: company.id,
            title,
            description,
            requirements: requirements || null,
            location: location || null,
            duration: duration || null,
            stipend: stipend || null,
            positionsAvailable: parseInt(positionsAvailable) || 1,
            deadline: new Date(deadline),
            status: 'open'
        });

        return res.status(201).json({
            success: true,
            message: 'Internship posted successfully',
            data: internship
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== VIEW APPLICATIONS ====================
const viewApplications = async (req, res) => {
    try {
        const company = await CompanyHR.findOne({ where: { userId: req.user.id } });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company profile not found' });
        }

        const { internshipId, status } = req.query;
        const whereClause = {};

        if (internshipId) {
            whereClause.internshipId = parseInt(internshipId);
        }

        if (status) {
            whereClause.status = status;
        }

        const applications = await Application.findAll({
            where: whereClause,
            include: [{
                model: Internship,
                where: { companyHRId: company.id }
            }, {
                model: Student,
                include: [{
                    model: User,
                    attributes: ['name', 'email']
                }]
            }],
            order: [['createdAt', 'DESC']]
        });

        const formattedApplications = applications.map(app => ({
            id: app.id,
            studentId: app.studentId,
            studentName: app.Student?.User?.name || 'Unknown Student',
            studentEmail: app.Student?.User?.email || 'Unknown',
            studentRollNumber: app.Student?.rollNumber || 'Unknown',
            studentCGPA: app.Student?.cgpa || 'N/A',
            internshipTitle: app.Internship?.title || 'Unknown',
            internshipId: app.internshipId,
            cvPath: app.cvPath,
            coverLetter: app.coverLetter,
            status: app.status,
            appliedDate: app.appliedDate,
            createdAt: app.createdAt
        }));

        // Get company internships for filter
        const internships = await Internship.findAll({
            where: { companyHRId: company.id },
            attributes: ['id', 'title']
        });

        return res.status(200).json({
            success: true,
            count: formattedApplications.length,
            internships: internships,
            data: formattedApplications
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== SHORTLIST STUDENT ====================
const shortlistStudent = async (req, res) => {
    try {
        const { applicationId } = req.params;

        // Get application
        const application = await Application.findByPk(applicationId, {
            include: [{
                model: Internship,
                include: [{
                    model: CompanyHR
                }]
            }]
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Check if company owns this internship
        const company = await CompanyHR.findOne({ where: { userId: req.user.id } });
        if (!company || application.Internship.companyHRId !== company.id) {
            return res.status(403).json({ success: false, message: 'You do not have permission to shortlist this application' });
        }

        // Check if already shortlisted
        if (application.status === 'shortlisted') {
            return res.status(400).json({ success: false, message: 'This student is already shortlisted' });
        }

        if (application.status === 'selected') {
            return res.status(400).json({ success: false, message: 'This student has already been selected' });
        }

        // Update application status
        await application.update({ status: 'shortlisted' });

        // Create shortlist record
        await Shortlist.create({
            applicationId: application.id
        });

        return res.status(200).json({
            success: true,
            message: 'Student shortlisted successfully',
            data: application
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== SCHEDULE INTERVIEW ====================
const scheduleInterview = async (req, res) => {
    try {
        const { applicationId, interviewDate, interviewTime, interviewMode, meetingLink } = req.body;

        if (!applicationId || !interviewDate || !interviewTime) {
            return res.status(400).json({ success: false, message: 'Application ID, date and time are required' });
        }

        // Get application
        const application = await Application.findByPk(applicationId, {
            include: [{
                model: Internship,
                include: [{
                    model: CompanyHR
                }]
            }]
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Check if company owns this internship
        const company = await CompanyHR.findOne({ where: { userId: req.user.id } });
        if (!company || application.Internship.companyHRId !== company.id) {
            return res.status(403).json({ success: false, message: 'You do not have permission to schedule interview for this application' });
        }

        // Check if application is shortlisted
        if (application.status !== 'shortlisted') {
            return res.status(400).json({ success: false, message: 'Student must be shortlisted before scheduling interview' });
        }

        // Check if interview already scheduled
        const shortlist = await Shortlist.findOne({ where: { applicationId: application.id } });
        if (!shortlist) {
            return res.status(404).json({ success: false, message: 'Shortlist record not found' });
        }

        const existingInterview = await Interview.findOne({ where: { shortlistId: shortlist.id } });
        if (existingInterview) {
            return res.status(400).json({ success: false, message: 'Interview already scheduled for this student' });
        }

        // Check if date is in past
        if (new Date(interviewDate) < new Date()) {
            return res.status(400).json({ success: false, message: 'Interview date cannot be in the past' });
        }

        // For online mode, meeting link is required
        if (interviewMode === 'online' && !meetingLink) {
            return res.status(400).json({ success: false, message: 'Meeting link is required for online interview' });
        }

        // Create interview
        const interview = await Interview.create({
            shortlistId: shortlist.id,
            interviewDate: new Date(interviewDate),
            interviewTime: interviewTime,
            interviewMode: interviewMode || 'online',
            meetingLink: meetingLink || null,
            status: 'scheduled'
        });

        return res.status(201).json({
            success: true,
            message: 'Interview scheduled successfully',
            data: interview
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== ASSIGN SUPERVISOR ====================
const assignSupervisor = async (req, res) => {
    try {
        const { studentId, supervisorId } = req.body;

        if (!studentId || !supervisorId) {
            return res.status(400).json({ success: false, message: 'Student ID and Supervisor ID are required' });
        }

        // Get company
        const company = await CompanyHR.findOne({ where: { userId: req.user.id } });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company profile not found' });
        }

        // Check if student exists and is selected
        const student = await Student.findByPk(studentId, {
            include: [{
                model: User,
                attributes: ['name', 'email']
            }]
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Check if student has a selected application with this company
        const application = await Application.findOne({
            where: {
                studentId: student.id,
                status: 'selected'
            },
            include: [{
                model: Internship,
                where: { companyHRId: company.id }
            }]
        });

        if (!application) {
            return res.status(400).json({ success: false, message: 'Student has not been shortlisted for any of your internships' });
        }

        // Check if supervisor exists and belongs to this company
        const supervisor = await Supervisor.findOne({
            where: {
                id: supervisorId,
                companyHRId: company.id
            }
        });

        if (!supervisor) {
            return res.status(404).json({ success: false, message: 'Supervisor not found or does not belong to your company' });
        }

        // Update student with supervisor
        await student.update({ supervisorId: supervisor.id, internshipStatus: 'selected' });

        // Update application status to selected
        await application.update({ status: 'selected' });

        return res.status(200).json({
            success: true,
            message: 'Supervisor assigned successfully',
            data: {
                student: student,
                supervisor: supervisor
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== GET SUPERVISORS (for dropdown) ====================
const getSupervisors = async (req, res) => {
    try {
        const company = await CompanyHR.findOne({ where: { userId: req.user.id } });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company profile not found' });
        }

        const supervisors = await Supervisor.findAll({
            where: { companyHRId: company.id },
            include: [{
                model: User,
                attributes: ['id', 'name', 'email']
            }]
        });

        const formattedSupervisors = supervisors.map(sup => ({
            id: sup.id,
            name: sup.User?.name || 'Unknown',
            email: sup.User?.email || 'Unknown',
            designation: sup.designation,
            department: sup.department
        }));

        return res.status(200).json({
            success: true,
            count: formattedSupervisors.length,
            data: formattedSupervisors
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== CONFIRM INTERNSHIP COMPLETION ====================
const confirmCompletion = async (req, res) => {
    try {
        const { studentId } = req.body;

        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Student ID is required' });
        }

        const company = await CompanyHR.findOne({ where: { userId: req.user.id } });
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company profile not found' });
        }

        // Check if student is assigned to this company
        const student = await Student.findByPk(studentId, {
            include: [{
                model: Supervisor,
                include: [{
                    model: CompanyHR
                }]
            }]
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        if (!student.Supervisor || student.Supervisor.companyHRId !== company.id) {
            return res.status(403).json({ success: false, message: 'Student does not belong to your company' });
        }

        // Check if student already completed
        if (student.internshipStatus === 'completed') {
            return res.status(400).json({ success: false, message: 'Internship already marked as completed' });
        }

        // Update student status
        await student.update({ internshipStatus: 'completed' });

        // Update internship status to completed if all positions filled
        // (Simplified - in real scenario, check all students)

        return res.status(200).json({
            success: true,
            message: 'Internship completion confirmed',
            data: student
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== SELECT STUDENT ====================
const selectStudent = async (req, res) => {
    try {
        const { applicationId } = req.params;

        // Get application
        const application = await Application.findByPk(applicationId, {
            include: [{
                model: Internship,
                include: [{
                    model: CompanyHR
                }]
            }]
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Check if company owns this internship
        const company = await CompanyHR.findOne({ where: { userId: req.user.id } });
        if (!company || application.Internship.companyHRId !== company.id) {
            return res.status(403).json({ success: false, message: 'You do not have permission to select this application' });
        }

        // Check if already selected
        if (application.status === 'selected') {
            return res.status(400).json({ success: false, message: 'This student is already selected' });
        }

        // Update application status
        await application.update({ status: 'selected' });

        return res.status(200).json({
            success: true,
            message: 'Student selected successfully',
            data: application
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== REJECT STUDENT ====================
const rejectStudent = async (req, res) => {
    try {
        const { applicationId } = req.params;

        // Get application
        const application = await Application.findByPk(applicationId, {
            include: [{
                model: Internship,
                include: [{
                    model: CompanyHR
                }]
            }]
        });

        if (!application) {
            return res.status(404).json({ 
                success: false, 
                message: 'Application not found' 
            });
        }

        // Check if company owns this internship
        const company = await CompanyHR.findOne({ where: { userId: req.user.id } });
        if (!company || application.Internship.companyHRId !== company.id) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to reject this application' 
            });
        }

        // Check if already rejected
        if (application.status === 'rejected') {
            return res.status(400).json({ 
                success: false, 
                message: 'This student is already rejected' 
            });
        }

        // Update application status
        await application.update({ status: 'rejected' });

        return res.status(200).json({
            success: true,
            message: 'Student rejected successfully',
            data: application
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
};



module.exports = {
    postInternship,
    viewApplications,
    shortlistStudent,
    scheduleInterview,
    assignSupervisor,
    getSupervisors,
    confirmCompletion,
    rejectStudent,
    selectStudent
};

