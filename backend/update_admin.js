const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function updateAdmin() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'internship_system'
        });

        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await connection.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, 'admin@internship.com']
        );
        
        console.log('Admin password updated successfully');
        await connection.end();
    } catch (err) {
        console.error(err);
    }
}

updateAdmin();
