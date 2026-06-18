const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evaluation = sequelize.define('Evaluation', {
    rating: {
        type: DataTypes.INTEGER,
        validate: {
            min: 1,
            max: 5
        }
    },
    strengths: {
        type: DataTypes.TEXT
    },
    weaknesses: {
        type: DataTypes.TEXT
    },
    comments: {
        type: DataTypes.TEXT
    },
    finalStatus: {
        type: DataTypes.ENUM('passed', 'failed'),
        defaultValue: 'passed'
    }
}, {
    timestamps: true,
    tableName: 'evaluations'
});

module.exports = Evaluation;
