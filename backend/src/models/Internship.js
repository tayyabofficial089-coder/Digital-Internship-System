const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Internship = sequelize.define('Internship', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    companyHRId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'company_hrs',
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    requirements: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    duration: {
        type: DataTypes.STRING,
        allowNull: true
    },
    stipend: {
        type: DataTypes.STRING,
        allowNull: true
    },
    positionsAvailable: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    deadline: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('open', 'closed', 'completed'),
        defaultValue: 'open'
    }
}, {
    timestamps: true,
    tableName: 'internships'
});

module.exports = Internship;