const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    rollNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    department: {
        type: DataTypes.STRING,
        allowNull: true
    },
    semester: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cgpa: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        validate: {
            min: 0,
            max: 4
        }
    },
    supervisorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'supervisors',
            key: 'id'
        }
    },
    internshipStatus: {
        type: DataTypes.ENUM('none', 'applied', 'shortlisted', 'selected', 'active', 'completed'),
        defaultValue: 'none'
    }
}, {
    timestamps: true,
    tableName: 'students'
});

module.exports = Student;