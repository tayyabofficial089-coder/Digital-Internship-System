const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Feedback = sequelize.define('Feedback', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    supervisorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'supervisors',
            key: 'id'
        }
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'students',
            key: 'id'
        }
    },
    progressId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'progresses',
            key: 'id'
        }
    },
    feedbackText: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 5
        }
    }
}, {
    timestamps: true,
    tableName: 'feedbacks'
});

module.exports = Feedback;