const { Op } = require('sequelize');
const { User, Student, CompanyHR, Supervisor, Admin, Internship, Application, Progress, Feedback } = require('../models');

// ==================== GET ALL USERS ====================
const getAllUsers = async (req, res) => {
    try {
        const { role, status, search } = req.query;
        const whereClause = {};

        if (role) {
            whereClause.role = role;
        }

        if (status) {
            whereClause.status = status;
        }

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        const users = await User.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });

        // Get profiles for each user
        const formattedUsers = await Promise.all(users.map(async (user) => {
            let profile = {};
            let profileDetails = '';

            switch (user.role) {
                case 'student':
                    const student = await Student.findOne({ 
                        where: { userId: user.id },
                        include: [{
                            model: Application,
                            include: [{
                                model: Internship,
                                include: [{ model: CompanyHR }]
                            }]
                        }]
                    });
                    profile = student ? student.toJSON() : {};
                    
                    let appliedCompanies = [];
                    if (student && student.Applications && student.Applications.length > 0) {
                        const companyNames = student.Applications
                            .map(app => app.Internship?.CompanyHR?.companyName)
                            .filter(Boolean);
                        appliedCompanies = [...new Set(companyNames)];
                    }
                    
                    profileDetails = `Roll: ${student?.rollNumber || 'N/A'}`;
                    if (appliedCompanies.length > 0) {
                        profileDetails += `<br><small class="text-muted"><i class="fas fa-building"></i> Applied: ${appliedCompanies.join(', ')}</small>`;
                    } else {
                        profileDetails += `<br><small class="text-muted"><i class="fas fa-building"></i> Applied: None</small>`;
                    }
                    break;
                case 'company_hr':
                    const company = await CompanyHR.findOne({ where: { userId: user.id } });
                    profile = company ? company.toJSON() : {};
                    profileDetails = `<strong>${company?.companyName || 'N/A'}</strong>`;
                    break;
                case 'supervisor':
                    const supervisor = await Supervisor.findOne({ 
                        where: { userId: user.id },
                        include: [{ model: CompanyHR }]
                    });
                    profile = supervisor ? supervisor.toJSON() : {};
                    profileDetails = `${supervisor?.designation || 'Supervisor'}`;
                    if (supervisor?.CompanyHR?.companyName) {
                        profileDetails += `<br><small class="text-muted"><i class="fas fa-building"></i> Company: ${supervisor.CompanyHR.companyName}</small>`;
                    }
                    break;
            }

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                profileDetails,
                profile,
                createdAt: user.createdAt
            };
        }));

        // Get statistics
        const stats = {
            total: await User.count(),
            students: await User.count({ where: { role: 'student' } }),
            companyHR: await User.count({ where: { role: 'company_hr' } }),
            supervisors: await User.count({ where: { role: 'supervisor' } }),
            pending: await User.count({ where: { status: 'pending' } }),
            approved: await User.count({ where: { status: 'approved' } }),
            blocked: await User.count({ where: { status: 'blocked' } }),
            rejected: await User.count({ where: { status: 'rejected' } })
        };

        return res.status(200).json({
            success: true,
            stats,
            count: formattedUsers.length,
            data: formattedUsers
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== APPROVE USER ====================
const approveUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.status === 'approved') {
            return res.status(400).json({ success: false, message: 'User is already approved' });
        }

        await user.update({ status: 'approved' });

        return res.status(200).json({
            success: true,
            message: `User ${user.name} has been approved`,
            data: user
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== REJECT USER ====================
const rejectUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.status === 'approved') {
            return res.status(400).json({ success: false, message: 'Cannot reject an approved user' });
        }

        await user.update({ status: 'rejected' });

        return res.status(200).json({
            success: true,
            message: `User ${user.name} has been rejected${reason ? `: ${reason}` : ''}`,
            data: user
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== BLOCK USER ====================
const blockUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ success: false, message: 'Cannot block admin account' });
        }

        if (user.status === 'blocked') {
            return res.status(400).json({ success: false, message: 'User is already blocked' });
        }

        await user.update({ status: 'blocked' });

        return res.status(200).json({
            success: true,
            message: `User ${user.name} has been blocked`,
            data: user
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== UNBLOCK USER ====================
const unblockUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.status !== 'blocked') {
            return res.status(400).json({ success: false, message: 'User is not blocked' });
        }

        await user.update({ status: 'approved' });

        return res.status(200).json({
            success: true,
            message: `User ${user.name} has been unblocked`,
            data: user
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== DELETE USER ====================
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if user is admin
        if (user.role === 'admin') {
            return res.status(400).json({ success: false, message: 'Cannot delete admin account' });
        }

        // Check if user is trying to delete themselves
        if (user.id === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        await user.destroy();

        return res.status(200).json({
            success: true,
            message: `User ${user.name} has been deleted`
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== GET INTERNSHIPS FOR VERIFICATION ====================
const getInternshipsForVerification = async (req, res) => {
    try {
        const internships = await Internship.findAll({
            where: { status: 'completed' },
            include: [{
                model: CompanyHR,
                include: [{
                    model: User,
                    attributes: ['name', 'email']
                }]
            }]
        });

        // Get student details for each internship
        const formattedInternships = await Promise.all(internships.map(async (internship) => {
            const students = await Student.findAll({
                where: {
                    internshipStatus: 'completed'
                },
                include: [{
                    model: User,
                    attributes: ['name', 'email']
                }]
            });

            return {
                id: internship.id,
                title: internship.title,
                companyName: internship.CompanyHR?.companyName || 'Unknown',
                companyUser: internship.CompanyHR?.User || {},
                students: students,
                createdAt: internship.createdAt,
                status: internship.status
            };
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

// ==================== VERIFY INTERNSHIP ====================
const verifyInternship = async (req, res) => {
    try {
        const { internshipId } = req.params;

        const internship = await Internship.findByPk(internshipId);
        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        if (internship.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Internship must be marked as completed first' });
        }

        // Check if all students have uploaded progress and received feedback
        const students = await Student.findAll({
            where: {
                internshipStatus: 'completed'
            }
        });

        let allProgressSubmitted = true;
        let allFeedbackGiven = true;

        for (const student of students) {
            const progress = await Progress.findAll({ where: { studentId: student.id } });
            if (progress.length === 0) {
                allProgressSubmitted = false;
                break;
            }

            const feedback = await Feedback.findAll({ where: { studentId: student.id } });
            if (feedback.length === 0) {
                allFeedbackGiven = false;
                break;
            }
        }

        if (!allProgressSubmitted) {
            return res.status(400).json({ success: false, message: 'Some students have not submitted progress' });
        }

        if (!allFeedbackGiven) {
            return res.status(400).json({ success: false, message: 'Some students have not received feedback' });
        }

        await internship.update({ status: 'closed' });

        return res.status(200).json({
            success: true,
            message: 'Internship record verified successfully',
            data: internship
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== GENERATE REPORTS ====================
const generateReport = async (req, res) => {
    try {
        const { type } = req.params;

        let data = {};
        let title = '';

        switch (type) {
            case 'students':
                title = 'Student Report';
                data.students = await Student.findAll({
                    include: [{
                        model: User,
                        attributes: ['name', 'email', 'status']
                    }]
                });
                data.total = data.students.length;
                break;

            case 'companies':
                title = 'Company Report';
                data.companies = await CompanyHR.findAll({
                    include: [{
                        model: User,
                        attributes: ['name', 'email', 'status']
                    }]
                });
                data.total = data.companies.length;
                break;

            case 'internships':
                title = 'Internship Report';
                data.internships = await Internship.findAll({
                    include: [{
                        model: CompanyHR,
                        include: [{
                            model: User,
                            attributes: ['name']
                        }]
                    }]
                });
                data.total = data.internships.length;
                const statusCount = {};
                data.internships.forEach(i => {
                    statusCount[i.status] = (statusCount[i.status] || 0) + 1;
                });
                data.statusCount = statusCount;
                break;

            case 'applications':
                title = 'Application Report';
                data.applications = await Application.findAll({
                    include: [{
                        model: Internship,
                        include: [{
                            model: CompanyHR,
                            include: [{
                                model: User,
                                attributes: ['name']
                            }]
                        }]
                    }, {
                        model: Student,
                        include: [{
                            model: User,
                            attributes: ['name']
                        }]
                    }]
                });
                data.total = data.applications.length;
                const appStatusCount = {};
                data.applications.forEach(app => {
                    appStatusCount[app.status] = (appStatusCount[app.status] || 0) + 1;
                });
                data.appStatusCount = appStatusCount;
                break;

            default:
                return res.status(400).json({ success: false, message: 'Invalid report type' });
        }

        return res.status(200).json({
            success: true,
            title,
            generatedAt: new Date(),
            data
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    getAllUsers,
    approveUser,
    rejectUser,
    blockUser,
    unblockUser,
    deleteUser,
    getInternshipsForVerification,
    verifyInternship,
    generateReport
};