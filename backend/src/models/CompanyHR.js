const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompanyHR = sequelize.define('CompanyHR', {
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
    companyName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    industry: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'company_hrs'
});

module.exports = CompanyHR;