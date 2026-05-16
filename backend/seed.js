const db = require('./config/db');
const bcrypt = require('bcryptjs');

const seed = async () => {
    try {
        console.log('Starting Database Setup...');

        // 1. Create Tables
        console.log('Creating/Verifying tables...');
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                creator_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS project_members (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT,
                user_id INT,
                role ENUM('Admin', 'Member') DEFAULT 'Member',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_membership (project_id, user_id)
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                due_date DATE,
                priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
                status ENUM('To Do', 'In Progress', 'Done') DEFAULT 'To Do',
                assigned_to INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // NEW: Notifications Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                sender_id INT,
                project_id INT,
                task_id INT,
                type VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                data JSON,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        `);

        // NEW: Assignment Requests Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS assignment_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_id INT NOT NULL,
                user_id INT NOT NULL,
                status ENUM('Pending', 'Accepted', 'Declined') DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('Tables verified/created successfully!');

        // 2. Create Admin User
        const adminEmail = 'admin@taskflow.com';
        const adminPassword = 'admin123';
        const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

        const [existingAdmin] = await db.query('SELECT * FROM users WHERE email = ?', [adminEmail]);
        let adminId;

        if (existingAdmin.length === 0) {
            const [userResult] = await db.query(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                ['System Admin', adminEmail, hashedAdminPassword]
            );
            adminId = userResult.insertId;
            console.log('Admin user created: admin@taskflow.com / admin123');
        } else {
            adminId = existingAdmin[0].id;
            console.log('Admin user already exists.');
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error during database setup:', error);
        process.exit(1);
    }
};

seed();
