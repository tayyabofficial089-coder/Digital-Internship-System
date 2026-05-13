const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supervisor = sequelize.define('Supervisor', {
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
    companyHRId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'company_hrs',
            key: 'id'
        }
    },
    designation: {
        type: DataTypes.STRING,
        allowNull: true
    },
    department: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'supervisors'
});

module.exports = Supervisor;