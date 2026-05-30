const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Interview = sequelize.define('Interview', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    shortlistId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'shortlists',
            key: 'id'
        }
    },
    interviewDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    interviewTime: {
        type: DataTypes.TIME,
        allowNull: false
    },
    interviewMode: {
        type: DataTypes.ENUM('online', 'onsite'),
        defaultValue: 'online'
    },
    meetingLink: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
        defaultValue: 'scheduled'
    }
}, {
    timestamps: true,
    tableName: 'interviews'
});

module.exports = Interview;