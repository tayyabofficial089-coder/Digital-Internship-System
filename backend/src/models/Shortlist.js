const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shortlist = sequelize.define('Shortlist', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    applicationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'applications',
            key: 'id'
        }
    },
    shortlistDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: 'shortlists'
});

module.exports = Shortlist;