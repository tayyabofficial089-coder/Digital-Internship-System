const mysql = require('mysql2/promise');

async function seedModules() {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'internship_system'
    });

    try {
        console.log('Fetching existing users...');
        const [companyHRs] = await connection.execute('SELECT * FROM company_hrs');
        const [students] = await connection.execute('SELECT * FROM students');
        const [supervisors] = await connection.execute('SELECT * FROM supervisors');

        if (companyHRs.length < 2 || students.length < 3 || supervisors.length < 2) {
            console.log('Please run the first seed script (seed_data.js) before running this one.');
            return;
        }

        const systemsHR = companyHRs.find(c => c.companyName === 'Systems Limited');
        const netsolHR = companyHRs.find(c => c.companyName === 'NetSol Technologies');

        const ali = students[0]; // Ali Hassan
        const fatima = students[1]; // Fatima Tariq
        const usman = students[2]; // Usman Khalid

        const bilal = supervisors.find(s => s.companyHRId === systemsHR.id); // Bilal
        const zainab = supervisors.find(s => s.companyHRId === netsolHR.id); // Zainab

        console.log('Cleaning up old mock data to prevent duplicates...');
        await connection.execute('DELETE FROM internships WHERE title IN ("MERN Stack Developer Intern", "Frontend Developer Intern", "React Native Intern", "Backend Node.js Intern")');

        console.log('Inserting Internships...');
        // Systems Limited Internships
        const [intern1] = await connection.execute(
            `INSERT INTO internships (companyHRId, title, description, location, duration, stipend, positionsAvailable, requirements, deadline, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, '2024-12-31', 'open')`,
            [systemsHR.id, 'MERN Stack Developer Intern', 'Work on cutting edge web technologies using MongoDB, Express, React, Node.', 'Lahore', '3 months', 'Rs. 20,000 - 30,000', 3, 'Basic knowledge of JavaScript and React']
        );
        const [intern2] = await connection.execute(
            `INSERT INTO internships (companyHRId, title, description, location, duration, stipend, positionsAvailable, requirements, deadline, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, '2024-12-31', 'open')`,
            [systemsHR.id, 'Frontend Developer Intern', 'Build responsive UIs with HTML, CSS, and Bootstrap.', 'Lahore', '2 months', 'Rs. 10,000 - 20,000', 2, 'Good CSS skills']
        );

        // NetSol Internships
        const [intern3] = await connection.execute(
            `INSERT INTO internships (companyHRId, title, description, location, duration, stipend, positionsAvailable, requirements, deadline, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, '2024-12-31', 'open')`,
            [netsolHR.id, 'React Native Intern', 'Develop cross-platform mobile apps.', 'Lahore', '6 months', 'Rs. 30,000 - 50,000', 2, 'Understanding of React and Mobile UI']
        );
        const [intern4] = await connection.execute(
            `INSERT INTO internships (companyHRId, title, description, location, duration, stipend, positionsAvailable, requirements, deadline, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, '2024-12-31', 'open')`,
            [netsolHR.id, 'Backend Node.js Intern', 'Develop robust APIs and handle database operations.', 'Lahore', '3 months', 'Rs. 20,000 - 30,000', 1, 'Node.js and MySQL']
        );

        console.log('Inserting Applications & Assigning Supervisors...');
        // Ali applies to MERN Stack and gets selected
        const [app1] = await connection.execute(
            `INSERT INTO applications (studentId, internshipId, status, coverLetter) VALUES (?, ?, 'selected', ?)`,
            [ali.id, intern1.insertId, 'I am very passionate about MERN stack and would love to join Systems Ltd.']
        );
        // Assign Bilal to Ali and update Ali's status
        await connection.execute(`UPDATE students SET supervisorId = ?, internshipStatus = 'active' WHERE id = ?`, [bilal.id, ali.id]);

        // Fatima applies to React Native and gets selected
        const [app2] = await connection.execute(
            `INSERT INTO applications (studentId, internshipId, status, coverLetter) VALUES (?, ?, 'selected', ?)`,
            [fatima.id, intern3.insertId, 'I have created 2 mobile apps in React Native and want to learn more.']
        );
        // Assign Zainab to Fatima and update Fatima's status
        await connection.execute(`UPDATE students SET supervisorId = ?, internshipStatus = 'active' WHERE id = ?`, [zainab.id, fatima.id]);

        // Usman applies to Backend (still pending)
        await connection.execute(
            `INSERT INTO applications (studentId, internshipId, status, coverLetter) VALUES (?, ?, 'pending', ?)`,
            [usman.id, intern4.insertId, 'I have strong logic building skills and know SQL well.']
        );

        console.log('Inserting Tasks...');
        const [task1] = await connection.execute(
            `INSERT INTO tasks (studentId, supervisorId, title, description, deadline, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
            [ali.id, bilal.id, 'Setup React Project and Routing', 'Initialize a new React app, setup React Router, and create basic page structure for the dashboard.', '2024-05-20']
        );
        const [task2] = await connection.execute(
            `INSERT INTO tasks (studentId, supervisorId, title, description, deadline, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
            [fatima.id, zainab.id, 'Create Login Screen UI', 'Design the login screen in React Native according to the provided Figma file.', '2024-05-22']
        );

        console.log('Inserting Progress & Feedback...');
        // Ali submits progress
        const [prog1] = await connection.execute(
            `INSERT INTO progresses (studentId, title, description, weekNumber, status) VALUES (?, ?, ?, ?, 'reviewed')`,
            [ali.id, 'Week 1 Progress: React Setup', 'I have successfully installed React and configured React Router. Created 3 empty pages.', 1]
        );
        
        // Bilal gives feedback on Ali's progress
        await connection.execute(
            `INSERT INTO feedbacks (studentId, progressId, supervisorId, feedbackText, rating) VALUES (?, ?, ?, ?, ?)`,
            [ali.id, prog1.insertId, bilal.id, 'Good start Ali! Next time make sure to use absolute imports for cleaner code.', 4]
        );

        console.log('All module data added successfully!');
    } catch (error) {
        console.error('Error inserting data:', error);
    } finally {
        await connection.end();
    }
}

seedModules();
