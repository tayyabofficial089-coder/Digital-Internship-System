const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define('Application', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'students',
            key: 'id'
        }
    },
    internshipId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'internships',
            key: 'id'
        }
    },
    cvPath: {
        type: DataTypes.STRING,
        allowNull: true
    },
    coverLetter: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'shortlisted', 'selected', 'rejected'),
        defaultValue: 'pending'
    },
    appliedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: 'applications'
});

module.exports = Application;