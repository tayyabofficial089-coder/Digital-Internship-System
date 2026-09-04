const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function seedDatabase() {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'internship_system'
    });

    try {
        const defaultPassword = await bcrypt.hash('password123', 10);

        console.log('Inserting Company HRs...');
        // 1. Systems Limited
        const [hr1] = await connection.execute(
            `INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'company_hr', 'approved')`,
            ['Ahmed Raza', 'ahmed@systems.com', defaultPassword]
        );
        const hr1UserId = hr1.insertId;
        await connection.execute(
            `INSERT INTO company_hrs (userId, companyName, industry, phone, address) VALUES (?, ?, ?, ?, ?)`,
            [hr1UserId, 'Systems Limited', 'IT Services', '03001234567', 'Lahore, Pakistan']
        );
        const [hr1Profile] = await connection.execute(`SELECT id FROM company_hrs WHERE userId = ?`, [hr1UserId]);
        const hr1Id = hr1Profile[0].id;

        // 2. NetSol Technologies
        const [hr2] = await connection.execute(
            `INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'company_hr', 'approved')`,
            ['Sana Malik', 'sana@netsol.com', defaultPassword]
        );
        const hr2UserId = hr2.insertId;
        await connection.execute(
            `INSERT INTO company_hrs (userId, companyName, industry, phone, address) VALUES (?, ?, ?, ?, ?)`,
            [hr2UserId, 'NetSol Technologies', 'Software Development', '03211234567', 'Lahore, Pakistan']
        );
        const [hr2Profile] = await connection.execute(`SELECT id FROM company_hrs WHERE userId = ?`, [hr2UserId]);
        const hr2Id = hr2Profile[0].id;

        console.log('Inserting Supervisors...');
        // Supervisor for Systems Ltd
        const [sup1] = await connection.execute(
            `INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'supervisor', 'approved')`,
            ['Bilal Ahmed', 'bilal@systems.com', defaultPassword]
        );
        await connection.execute(
            `INSERT INTO supervisors (userId, companyHRId, designation, department, phone) VALUES (?, ?, ?, ?, ?)`,
            [sup1.insertId, hr1Id, 'Senior Developer', 'Engineering', '03331234567']
        );

        // Supervisor for NetSol
        const [sup2] = await connection.execute(
            `INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'supervisor', 'approved')`,
            ['Zainab Khan', 'zainab@netsol.com', defaultPassword]
        );
        await connection.execute(
            `INSERT INTO supervisors (userId, companyHRId, designation, department, phone) VALUES (?, ?, ?, ?, ?)`,
            [sup2.insertId, hr2Id, 'Technical Lead', 'Software Development', '03451234567']
        );

        console.log('Inserting Students...');
        const studentsData = [
            { name: 'Ali Hassan', email: 'ali@student.com', roll: 'BIT-F20-011', phone: '03009876543', dept: 'Computer Science' },
            { name: 'Fatima Tariq', email: 'fatima@student.com', roll: 'BIT-F20-045', phone: '03219876543', dept: 'Software Engineering' },
            { name: 'Usman Khalid', email: 'usman@student.com', roll: 'BIT-F20-089', phone: '03339876543', dept: 'Information Technology' }
        ];

        for (const s of studentsData) {
            const [user] = await connection.execute(
                `INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'student', 'approved')`,
                [s.name, s.email, defaultPassword]
            );
            await connection.execute(
                `INSERT INTO students (userId, rollNumber, phone, department, semester, cgpa, internshipStatus) VALUES (?, ?, ?, ?, '8th', 3.5, 'none')`,
                [user.insertId, s.roll, s.phone, s.dept]
            );
        }

        console.log('Mock data added successfully!');
    } catch (error) {
        console.error('Error inserting data:', error);
    } finally {
        await connection.end();
    }
}

seedDatabase();
