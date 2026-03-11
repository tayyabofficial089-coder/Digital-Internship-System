-- Create Database
CREATE DATABASE IF NOT EXISTS internship_system;
USE internship_system;

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'company_hr', 'supervisor', 'admin') NOT NULL DEFAULT 'student',
    status ENUM('pending', 'approved', 'rejected', 'blocked') DEFAULT 'pending',
    resetToken VARCHAR(255) NULL,
    resetTokenExpiry BIGINT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==================== STUDENTS TABLE ====================
CREATE TABLE IF NOT EXISTS students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    rollNumber VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    department VARCHAR(100) NULL,
    semester VARCHAR(20) NULL,
    cgpa DECIMAL(3,2) NULL CHECK (cgpa >= 0 AND cgpa <= 4),
    supervisorId INT NULL,
    internshipStatus ENUM('none', 'applied', 'shortlisted', 'selected', 'active', 'completed') DEFAULT 'none',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== COMPANY HRS TABLE ====================
CREATE TABLE IF NOT EXISTS company_hrs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    companyName VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== SUPERVISORS TABLE ====================
CREATE TABLE IF NOT EXISTS supervisors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    companyHRId INT NOT NULL,
    designation VARCHAR(100) NULL,
    department VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (companyHRId) REFERENCES company_hrs(id) ON DELETE CASCADE
);

-- ==================== ADMINS TABLE ====================
CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== INTERNSHIPS TABLE ====================
CREATE TABLE IF NOT EXISTS internships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    companyHRId INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT NULL,
    location VARCHAR(255) NULL,
    duration VARCHAR(100) NULL,
    stipend VARCHAR(100) NULL,
    positionsAvailable INT DEFAULT 1,
    deadline DATETIME NOT NULL,
    status ENUM('open', 'closed', 'completed') DEFAULT 'open',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (companyHRId) REFERENCES company_hrs(id) ON DELETE CASCADE
);

-- ==================== APPLICATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    studentId INT NOT NULL,
    internshipId INT NOT NULL,
    cvPath VARCHAR(255) NULL,
    coverLetter TEXT NULL,
    status ENUM('pending', 'shortlisted', 'selected', 'rejected') DEFAULT 'pending',
    appliedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (internshipId) REFERENCES internships(id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (studentId, internshipId)
);

-- ==================== SHORTLISTS TABLE ====================
CREATE TABLE IF NOT EXISTS shortlists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    applicationId INT NOT NULL UNIQUE,
    shortlistDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE
);

-- ==================== INTERVIEWS TABLE ====================
CREATE TABLE IF NOT EXISTS interviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shortlistId INT NOT NULL UNIQUE,
    interviewDate DATETIME NOT NULL,
    interviewTime TIME NOT NULL,
    interviewMode ENUM('online', 'onsite') DEFAULT 'online',
    meetingLink VARCHAR(255) NULL,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shortlistId) REFERENCES shortlists(id) ON DELETE CASCADE
);

-- ==================== TASKS TABLE ====================
CREATE TABLE IF NOT EXISTS tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supervisorId INT NOT NULL,
    studentId INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    deadline DATETIME NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'overdue') DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supervisorId) REFERENCES supervisors(id) ON DELETE CASCADE,
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
);

-- ==================== PROGRESS TABLE ====================
CREATE TABLE IF NOT EXISTS progresses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    studentId INT NOT NULL,
    taskId INT NULL,
    weekNumber INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    filePath VARCHAR(255) NULL,
    status ENUM('pending', 'reviewed', 'approved') DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE SET NULL,
    UNIQUE KEY unique_week_progress (studentId, weekNumber)
);

-- ==================== FEEDBACK TABLE ====================
CREATE TABLE IF NOT EXISTS feedbacks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supervisorId INT NOT NULL,
    studentId INT NOT NULL,
    progressId INT NULL,
    feedbackText TEXT NOT NULL,
    rating INT NULL CHECK (rating >= 1 AND rating <= 5),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supervisorId) REFERENCES supervisors(id) ON DELETE CASCADE,
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (progressId) REFERENCES progresses(id) ON DELETE SET NULL
);

-- ==================== EVALUATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS evaluations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    studentId INT NOT NULL,
    supervisorId INT NOT NULL,
    internshipId INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    strengths TEXT NULL,
    weaknesses TEXT NULL,
    comments TEXT NULL,
    finalStatus ENUM('passed', 'failed') DEFAULT 'passed',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (supervisorId) REFERENCES supervisors(id) ON DELETE CASCADE,
    FOREIGN KEY (internshipId) REFERENCES internships(id) ON DELETE CASCADE
);

-- ==================== NOTIFICATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NULL,
    isRead BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ==================== INSERT DEFAULT ADMIN ====================
INSERT INTO users (name, email, password, role, status) VALUES 
('Admin', 'admin@internship.com', '$2a$10$YourHashedPasswordHere', 'admin', 'approved');

INSERT INTO admins (userId) VALUES (1);

-- ==================== ADD FOREIGN KEY CONSTRAINTS ====================
ALTER TABLE students ADD FOREIGN KEY (supervisorId) REFERENCES supervisors(id) ON DELETE SET NULL;