const sequelize = require('../config/database');
const User = require('./User');
const Student = require('./Student');
const CompanyHR = require('./CompanyHR');
const Supervisor = require('./Supervisor');
const Admin = require('./Admin');
const Internship = require('./Internship');
const Application = require('./Application');
const Shortlist = require('./Shortlist');
const Interview = require('./Interview');
const Task = require('./Task');
const Progress = require('./Progress');
const Feedback = require('./Feedback');
const Evaluation = require('./Evaluation');
const Notification = require('./Notification');

// ==================== RELATIONSHIPS ====================

// User -> Student (One-to-One)
User.hasOne(Student, { foreignKey: 'userId', onDelete: 'CASCADE' });
Student.belongsTo(User, { foreignKey: 'userId' });

// User -> CompanyHR (One-to-One)
User.hasOne(CompanyHR, { foreignKey: 'userId', onDelete: 'CASCADE' });
CompanyHR.belongsTo(User, { foreignKey: 'userId' });

// User -> Supervisor (One-to-One)
User.hasOne(Supervisor, { foreignKey: 'userId', onDelete: 'CASCADE' });
Supervisor.belongsTo(User, { foreignKey: 'userId' });

// User -> Admin (One-to-One)
User.hasOne(Admin, { foreignKey: 'userId', onDelete: 'CASCADE' });
Admin.belongsTo(User, { foreignKey: 'userId' });

// CompanyHR -> Internship (One-to-Many)
CompanyHR.hasMany(Internship, { foreignKey: 'companyHRId', onDelete: 'CASCADE' });
Internship.belongsTo(CompanyHR, { foreignKey: 'companyHRId' });

// CompanyHR -> Supervisor (One-to-Many)
CompanyHR.hasMany(Supervisor, { foreignKey: 'companyHRId', onDelete: 'CASCADE' });
Supervisor.belongsTo(CompanyHR, { foreignKey: 'companyHRId' });

// Internship -> Application (One-to-Many)
Internship.hasMany(Application, { foreignKey: 'internshipId', onDelete: 'CASCADE' });
Application.belongsTo(Internship, { foreignKey: 'internshipId' });

// Student -> Application (One-to-Many)
Student.hasMany(Application, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Application.belongsTo(Student, { foreignKey: 'studentId' });

// Application -> Shortlist (One-to-One)
Application.hasOne(Shortlist, { foreignKey: 'applicationId', onDelete: 'CASCADE' });
Shortlist.belongsTo(Application, { foreignKey: 'applicationId' });

// Shortlist -> Interview (One-to-One)
Shortlist.hasOne(Interview, { foreignKey: 'shortlistId', onDelete: 'CASCADE' });
Interview.belongsTo(Shortlist, { foreignKey: 'shortlistId' });

// Supervisor -> Student (One-to-Many) - Supervisor monitors multiple students
Supervisor.hasMany(Student, { foreignKey: 'supervisorId' });
Student.belongsTo(Supervisor, { foreignKey: 'supervisorId' });

// Supervisor -> Task (One-to-Many)
Supervisor.hasMany(Task, { foreignKey: 'supervisorId', onDelete: 'CASCADE' });
Task.belongsTo(Supervisor, { foreignKey: 'supervisorId' });

// Student -> Task (One-to-Many)
Student.hasMany(Task, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Task.belongsTo(Student, { foreignKey: 'studentId' });

// Student -> Progress (One-to-Many)
Student.hasMany(Progress, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Progress.belongsTo(Student, { foreignKey: 'studentId' });

// Task -> Progress (One-to-Many)
Task.hasMany(Progress, { foreignKey: 'taskId', onDelete: 'CASCADE' });
Progress.belongsTo(Task, { foreignKey: 'taskId' });

// Student -> Feedback (One-to-Many)
Student.hasMany(Feedback, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Feedback.belongsTo(Student, { foreignKey: 'studentId' });

// Supervisor -> Feedback (One-to-Many)
Supervisor.hasMany(Feedback, { foreignKey: 'supervisorId', onDelete: 'CASCADE' });
Feedback.belongsTo(Supervisor, { foreignKey: 'supervisorId' });

// Progress -> Feedback (One-to-One)
Progress.hasOne(Feedback, { foreignKey: 'progressId', onDelete: 'CASCADE' });
Feedback.belongsTo(Progress, { foreignKey: 'progressId' });

// Evaluations Relationships
Student.hasOne(Evaluation, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Evaluation.belongsTo(Student, { foreignKey: 'studentId' });

Supervisor.hasMany(Evaluation, { foreignKey: 'supervisorId', onDelete: 'CASCADE' });
Evaluation.belongsTo(Supervisor, { foreignKey: 'supervisorId' });

Internship.hasMany(Evaluation, { foreignKey: 'internshipId', onDelete: 'CASCADE' });
Evaluation.belongsTo(Internship, { foreignKey: 'internshipId' });

// Notifications Relationships
User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// Sync database
const syncDatabase = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('✅ Database synced successfully');
    } catch (error) {
        console.error('❌ Database sync failed:', error);
    }
};

module.exports = {
    sequelize,
    syncDatabase,
    User,
    Student,
    CompanyHR,
    Supervisor,
    Admin,
    Internship,
    Application,
    Shortlist,
    Interview,
    Task,
    Progress,
    Feedback,
    Evaluation,
    Notification
};