const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { generateToken } = require('../config/auth');
const { User, Student, CompanyHR, Supervisor, Admin } = require('../models');
const { Op } = require('sequelize');

// ==================== STUDENT REGISTRATION ====================
const registerStudent = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, rollNumber, password, phone, department, semester, cgpa } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const existingStudent = await Student.findOne({ where: { rollNumber } });
        if (existingStudent) {
            return res.status(400).json({ success: false, message: 'Roll number already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'student',
            status: 'approved'
        });

        await Student.create({
            userId: user.id,
            rollNumber,
            phone,
            department,
            semester,
            cgpa: cgpa || null
        });

        return res.status(201).json({
            success: true,
            message: 'Student registered successfully.'
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== COMPANY HR REGISTRATION ====================
const registerCompany = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { companyName, hrName, email, password, phone, industry, address } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: hrName,
            email,
            password: hashedPassword,
            role: 'company_hr',
            status: 'pending'
        });

        await CompanyHR.create({
            userId: user.id,
            companyName,
            industry: industry || null,
            phone,
            address: address || null
        });

        return res.status(201).json({
            success: true,
            message: 'Company registered successfully. Waiting for admin approval.'
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== SUPERVISOR REGISTRATION ====================
const registerSupervisor = async (req, res) => {
    try {
        const { name, email, password, phone, designation, department } = req.body;
        const companyHRId = req.user.id;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const companyHR = await CompanyHR.findOne({ where: { userId: companyHRId } });
        if (!companyHR) {
            return res.status(404).json({ success: false, message: 'Company HR not found' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'supervisor',
            status: 'approved'
        });

        await Supervisor.create({
            userId: user.id,
            companyHRId: companyHR.id,
            designation: designation || null,
            department: department || null,
            phone: phone || null
        });

        return res.status(201).json({
            success: true,
            message: 'Supervisor registered successfully.',
            data: { id: user.id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== LOGIN ====================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.status === 'pending') {
            return res.status(403).json({ success: false, message: 'Account pending admin approval' });
        }
        if (user.status === 'blocked') {
            return res.status(403).json({ success: false, message: 'Your account has been blocked' });
        }
        if (user.status === 'rejected') {
            return res.status(403).json({ success: false, message: 'Your account registration was rejected' });
        }

        const token = generateToken(user);

        let profile = {};
        let redirectUrl = '';

        switch (user.role) {
            case 'student':
                const student = await Student.findOne({ where: { userId: user.id } });
                profile = student ? student.toJSON() : {};
                redirectUrl = 'http://localhost:5000/student/dashboard.html';
                break;
            case 'company_hr':
                const company = await CompanyHR.findOne({ where: { userId: user.id } });
                profile = company ? company.toJSON() : {};
                redirectUrl = 'http://localhost:5000/company/dashboard.html';
                break;
            case 'supervisor':
                const supervisor = await Supervisor.findOne({ where: { userId: user.id } });
                profile = supervisor ? supervisor.toJSON() : {};
                redirectUrl = 'http://localhost:5000/supervisor/dashboard.html';
                break;
            case 'admin':
                const admin = await Admin.findOne({ where: { userId: user.id } });
                profile = admin ? admin.toJSON() : {};
                redirectUrl = 'http://localhost:5000/admin/dashboard.html';
                break;
        }

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                redirectUrl,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    profile
                }
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== FORGOT PASSWORD ====================
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Email not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000;

        await user.update({ resetToken, resetTokenExpiry });

        console.log(`Reset token for ${email}: ${resetToken}`);

        return res.status(200).json({
            success: true,
            message: 'Password reset link sent to your email',
            resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ==================== RESET PASSWORD ====================
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Token and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
        }

        const user = await User.findOne({
            where: {
                resetToken: token,
                resetTokenExpiry: { [Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null
        });

        return res.status(200).json({
            success: true,
            message: 'Password reset successful'
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    registerStudent,
    registerCompany,
    registerSupervisor,
    login,
    forgotPassword,
    resetPassword
};