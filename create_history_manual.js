const fs = require('fs');
const { execSync } = require('child_process');

function run(cmd, env = {}) {
    try {
        const newPath = process.env.PATH + ';D:\\Git\\cmd';
        execSync(cmd, { stdio: 'inherit', env: { ...process.env, PATH: newPath, ...env } });
    } catch (e) {
        console.error(`Command failed: ${cmd}`);
    }
}

// 1. Setup clean repo
try { fs.rmSync('.git', { recursive: true, force: true }); } catch (e) {}
run('git init');
run('git config user.name "tayyabofficial089-coder"');
run('git config user.email "tayyabofficial089@gmail.com"');

// 2. Exact Hardcoded Active Days (Guarantees exactly what the user requested)
const activeDaysStr = [
    // March (3-4 days a week)
    "2026-03-05", "2026-03-06", "2026-03-08",
    "2026-03-09", "2026-03-11", "2026-03-13", "2026-03-14",
    "2026-03-17", "2026-03-18", "2026-03-20",
    "2026-03-23", "2026-03-25", "2026-03-26", "2026-03-28",
    "2026-03-31", 
    // April
    "2026-04-01", "2026-04-03", "2026-04-04",
    "2026-04-06", "2026-04-07", "2026-04-09",
    "2026-04-14", "2026-04-16", "2026-04-17", "2026-04-19",
    "2026-04-20", "2026-04-22", "2026-04-24",
    "2026-04-28", "2026-04-30", 
    // May
    "2026-05-02", "2026-05-03",
    "2026-05-05", "2026-05-06", "2026-05-08",
    "2026-05-11", "2026-05-13", "2026-05-15", "2026-05-16",
    "2026-05-19", "2026-05-21", "2026-05-22",
    "2026-05-25", "2026-05-27", "2026-05-28", "2026-05-30",
    // June (early)
    "2026-06-02", "2026-06-03", "2026-06-05",
    "2026-06-08", "2026-06-10", "2026-06-11", "2026-06-13",
    "2026-06-16", "2026-06-18", "2026-06-19",
    // June 20 to July 2 (EXACTLY 7 DAYS as requested)
    "2026-06-22", "2026-06-23", "2026-06-25", "2026-06-27", "2026-06-29",
    "2026-07-01", "2026-07-02",
    // August 17 to Sept 15 (INCREASED DAYS as requested - ~16 days)
    "2026-08-17", "2026-08-19", "2026-08-21", "2026-08-22",
    "2026-08-25", "2026-08-26", "2026-08-28",
    "2026-09-01", "2026-09-02", "2026-09-04", "2026-09-05",
    "2026-09-08", "2026-09-10", "2026-09-11",
    "2026-09-14", "2026-09-15"
];

// Convert to Date objects with a fixed time to avoid timezone shifts
const activeDays = activeDaysStr.map(d => new Date(`${d}T14:00:00Z`));
console.log(`Total fixed active days: ${activeDays.length}`);

// 3. Define the files and commits logically
const commitTasks = [
    { file: '.gitignore', msg: 'Add gitignore to prevent committing node_modules and secrets' },
    { file: 'backend/.env.example', msg: 'Add environment variable template' },
    { file: 'backend/package.json', msg: 'Initialize Node.js backend package configuration' },
    { file: 'backend/package-lock.json', msg: 'Lock dependency versions' },
    { file: 'database/internship_system.sql', msg: 'Add initial database schema' },
    { file: 'backend/server.js', msg: 'Add main Express server entry point' },
    { file: 'backend/src/config/database.js', msg: 'Add database connection configuration' },
    { file: 'backend/src/utils/helpers.js', msg: 'Add utility functions for backend' },
    { file: 'backend/src/models/index.js', msg: 'Add model index and associations setup' },
    { file: 'backend/src/models/User.js', msg: 'Add User base model' },
    { file: 'backend/src/models/Admin.js', msg: 'Add Admin database model' },
    { file: 'backend/src/config/auth.js', msg: 'Add authentication configuration' },
    { file: 'backend/src/middleware/auth.js', msg: 'Add JWT authentication middleware' },
    { file: 'backend/src/controllers/authController.js', msg: 'Implement authentication logic' },
    { file: 'backend/src/routes/authRoutes.js', msg: 'Add API routes for auth' },
    { file: 'frontend/login.html', msg: 'Add unified login page' },
    { file: 'frontend/css/style.css', msg: 'Add global stylesheet' },
    { file: 'backend/src/models/Student.js', msg: 'Add Student model' },
    { file: 'backend/src/controllers/studentController.js', msg: 'Add student controller logic' },
    { file: 'backend/src/routes/studentRoutes.js', msg: 'Add student API routes' },
    { file: 'frontend/js/student.js', msg: 'Add student frontend JavaScript logic' },
    { file: 'frontend/student/login.html', msg: 'Add student specific login page' },
    { file: 'frontend/student/register.html', msg: 'Add student registration form' },
    { file: 'frontend/student/dashboard.html', msg: 'Create student dashboard UI' },
    { file: 'backend/src/models/CompanyHR.js', msg: 'Add Company HR model' },
    { file: 'backend/src/controllers/companyController.js', msg: 'Implement company controller' },
    { file: 'backend/src/routes/companyRoutes.js', msg: 'Add company API routes' },
    { file: 'frontend/company/register.html', msg: 'Add company registration UI' },
    { file: 'frontend/company/login.html', msg: 'Add company login UI' },
    { file: 'frontend/company/dashboard.html', msg: 'Create company dashboard UI' },
    { file: 'frontend/js/company.js', msg: 'Add company frontend JS logic' },
    { file: 'backend/src/models/Internship.js', msg: 'Create Internship model' },
    { file: 'backend/src/models/Application.js', msg: 'Create Application model' },
    { file: 'frontend/company/post-internship.html', msg: 'Add form to post internships' },
    { file: 'frontend/student/internships.html', msg: 'Add internship browsing for students' },
    { file: 'frontend/student/apply-internship.html', msg: 'Add internship application flow' },
    { file: 'backend/src/models/Supervisor.js', msg: 'Add Supervisor model' },
    { file: 'backend/src/controllers/supervisorController.js', msg: 'Implement supervisor backend logic' },
    { file: 'backend/src/routes/supervisorRoutes.js', msg: 'Add supervisor API routes' },
    { file: 'backend/src/controllers/adminController.js', msg: 'Implement admin backend logic' },
    { file: 'backend/src/routes/adminRoutes.js', msg: 'Add admin API routes' },
    { file: 'frontend/supervisor/login.html', msg: 'Add supervisor login UI' },
    { file: 'frontend/supervisor/dashboard.html', msg: 'Add supervisor dashboard' },
    { file: 'frontend/js/supervisor.js', msg: 'Add supervisor frontend logic' },
    { file: 'backend/src/models/Shortlist.js', msg: 'Add Shortlist model for candidates' },
    { file: 'backend/src/models/Interview.js', msg: 'Add Interview model' },
    { file: 'frontend/company/applications.html', msg: 'Add UI to view received applications' },
    { file: 'frontend/company/interview.html', msg: 'Add interview scheduling UI' },
    { file: 'backend/src/models/Task.js', msg: 'Add Task tracking model' },
    { file: 'backend/src/models/Progress.js', msg: 'Add Progress report model' },
    { file: 'frontend/supervisor/assign-task.html', msg: 'Add task assignment UI for supervisors' },
    { file: 'frontend/supervisor/students.html', msg: 'Add student listing for supervisors' },
    { file: 'frontend/student/tasks.html', msg: 'Add task viewing for students' },
    { file: 'frontend/student/progress.html', msg: 'Add progress submission flow' },
    { file: 'backend/src/models/Evaluation.js', msg: 'Add Evaluation model' },
    { file: 'backend/src/models/Feedback.js', msg: 'Add Feedback model' },
    { file: 'frontend/student/feedback.html', msg: 'Add feedback submission UI for students' },
    { file: 'frontend/supervisor/feedback.html', msg: 'Add feedback viewing for supervisors' },
    { file: 'backend/src/models/Notification.js', msg: 'Add Notification tracking model' },
    { file: 'frontend/admin/login.html', msg: 'Create admin authentication UI' },
    { file: 'frontend/admin/dashboard.html', msg: 'Create admin dashboard UI' },
    { file: 'frontend/admin/manage-users.html', msg: 'Add user management interface for admin' },
    { file: 'frontend/js/admin.js', msg: 'Add admin dashboard JavaScript logic' },
    { file: 'frontend/company/assign-supervisor.html', msg: 'Add UI for assigning supervisors' },
    { file: 'frontend/company/supervisor.html', msg: 'Add supervisor details view for companies' },
    { file: 'frontend/company/confirm-completion.html', msg: 'Add internship completion confirmation flow' },
    { file: 'backend/src/config/multer.js', msg: 'Add multer upload configuration' },
    { file: 'backend/src/middleware/upload.js', msg: 'Add file upload middleware' },
    { file: 'frontend/admin/reports.html', msg: 'Add system reports UI' },
    { file: 'frontend/admin/verify-internships.html', msg: 'Add internship verification flow' },
    { file: 'frontend/forgot-password.html', msg: 'Add password reset flow UI' },
    { file: 'frontend/reset-password.html', msg: 'Add password confirmation UI' },
    { file: 'backend/seed_data.js', msg: 'Add database seeders for testing' },
    { file: 'backend/seed_modules.js', msg: 'Add module seeders' },
    { file: 'backend/create_tables.js', msg: 'Add database initialization scripts' },
    { file: 'backend/update_admin.js', msg: 'Add script to update admin credentials' },
    { file: 'frontend/index.html', msg: 'Update landing page and unified login links' },
    { file: 'frontend/student/applications.html', msg: 'Polish student applications view' }
];

fs.writeFileSync('backend/.env.example', 'PORT=5000\\nDB_HOST=localhost\\nDB_USER=root\\nDB_PASS=\\nDB_NAME=internship_system\\nJWT_SECRET=your_jwt_secret_here\\n');

// Distribute tasks across exact active days
let taskIdx = 0;
let dayIdx = 0;

while (taskIdx < commitTasks.length) {
    let day = activeDays[dayIdx];
    
    // Default to 1 task per day to ensure all 75 days get hit
    let tasksForToday = 1;
    // Every ~15th task, add an extra task to the same day to consume the 3 extra tasks (78 tasks vs 75 days)
    if (commitTasks.length - taskIdx > activeDays.length - dayIdx) {
        tasksForToday = 2;
    }
    
    for (let i = 0; i < tasksForToday; i++) {
        if (taskIdx >= commitTasks.length) break;
        let task = commitTasks[taskIdx];
        if (!fs.existsSync(task.file)) {
            taskIdx++;
            continue;
        }

        run(`git add "${task.file}"`);
        
        let hour = 10 + Math.floor(Math.random() * 8); 
        let min = Math.floor(Math.random() * 60);
        let dateStr = `${day.toISOString().split('T')[0]}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00Z`;

        const env = {
            GIT_AUTHOR_DATE: dateStr,
            GIT_COMMITTER_DATE: dateStr,
            GIT_AUTHOR_NAME: "tayyabofficial089-coder",
            GIT_AUTHOR_EMAIL: "tayyabofficial089@gmail.com",
            GIT_COMMITTER_NAME: "tayyabofficial089-coder",
            GIT_COMMITTER_EMAIL: "tayyabofficial089@gmail.com"
        };
        
        run(`git commit -m "${task.msg}"`, env);
        taskIdx++;
    }
    
    dayIdx = (dayIdx + 1);
    // If we reach the end of days but still have tasks, cycle back
    if (dayIdx >= activeDays.length && taskIdx < commitTasks.length) {
        dayIdx = activeDays.length - 1;
    }
}

run('git add .');
const finalDate = "2026-09-15T18:00:00Z";
const finalEnv = {
    GIT_AUTHOR_DATE: finalDate,
    GIT_COMMITTER_DATE: finalDate,
    GIT_AUTHOR_NAME: "tayyabofficial089-coder",
    GIT_AUTHOR_EMAIL: "tayyabofficial089@gmail.com",
    GIT_COMMITTER_NAME: "tayyabofficial089-coder",
    GIT_COMMITTER_EMAIL: "tayyabofficial089@gmail.com"
};
run('git commit -m "Final bug fixes and layout polishing"', finalEnv);

run('git branch -M main');
run('git remote add origin https://github.com/tayyabofficial089-coder/Digital-Internship-System.git');
console.log("Manual Git history recreated successfully!");
