const mysql = require('mysql2/promise');

async function createMissingTables() {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'internship_system'
    });

    try {
        console.log('Creating evaluations table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS evaluations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                studentId INT NOT NULL,
                supervisorId INT NOT NULL,
                internshipId INT NOT NULL,
                rating INT,
                strengths TEXT,
                weaknesses TEXT,
                comments TEXT,
                finalStatus ENUM('passed', 'failed') DEFAULT 'passed',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (supervisorId) REFERENCES supervisors(id) ON DELETE CASCADE,
                FOREIGN KEY (internshipId) REFERENCES internships(id) ON DELETE CASCADE
            );
        `);

        console.log('Creating notifications table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                userId INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50),
                isRead BOOLEAN DEFAULT FALSE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            );
        `);
        console.log('Tables created successfully!');
    } catch (error) {
        console.error('Error creating tables:', error);
    } finally {
        await connection.end();
    }
}

createMissingTables();
