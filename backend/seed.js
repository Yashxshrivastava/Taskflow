const db = require('./config/db');
const bcrypt = require('bcryptjs');

const seed = async () => {
    try {
        console.log('Seeding database...');

        // 1. Create Admin User
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

        // 2. Create Member User
        const memberEmail = 'member@taskflow.com';
        const memberPassword = 'member123';
        const hashedMemberPassword = await bcrypt.hash(memberPassword, 10);

        const [existingMember] = await db.query('SELECT * FROM users WHERE email = ?', [memberEmail]);
        let memberId;

        if (existingMember.length === 0) {
            const [userResult] = await db.query(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                ['Team Member', memberEmail, hashedMemberPassword]
            );
            memberId = userResult.insertId;
            console.log('Member user created: member@taskflow.com / member123');
        } else {
            memberId = existingMember[0].id;
            console.log('Member user already exists.');
        }

        // 3. Create Sample Project
        const [existingProject] = await db.query('SELECT * FROM projects WHERE creator_id = ?', [adminId]);
        let projectId;

        if (existingProject.length === 0) {
            const [projResult] = await db.query(
                'INSERT INTO projects (name, description, creator_id) VALUES (?, ?, ?)',
                ['Launch TaskFlow', 'Initial development and launch phase of the project manager app.', adminId]
            );
            projectId = projResult.insertId;

            // Add Admin to project as Admin role
            await db.query(
                'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
                [projectId, adminId, 'Admin']
            );
            console.log('Sample project "Launch TaskFlow" created.');
        } else {
            projectId = existingProject[0].id;
        }

        // 4. Add Member to Project
        const [memberProjectCheck] = await db.query('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, memberId]);
        if (memberProjectCheck.length === 0) {
            await db.query(
                'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
                [projectId, memberId, 'Member']
            );
            console.log('Member added to "Launch TaskFlow" project.');
        }

        // 5. Create Sample Tasks
        const [existingTasks] = await db.query('SELECT * FROM tasks WHERE project_id = ?', [projectId]);
        if (existingTasks.length === 0) {
            const tasks = [
                ['Database Setup', 'Initialize MySQL schema and seed data.', '2026-06-01', 'High', 'Done', adminId],
                ['API Development', 'Implement Auth and Project CRUD routes.', '2026-06-05', 'Medium', 'In Progress', adminId],
                ['UI Components', 'Design MUI dashboard and board view.', '2026-06-10', 'Medium', 'To Do', memberId],
                ['Final Testing', 'Run end-to-end tests and polish UI.', '2026-06-15', 'High', 'To Do', memberId]
            ];

            for (const [title, desc, dueDate, priority, status, assignee] of tasks) {
                await db.query(
                    'INSERT INTO tasks (project_id, title, description, due_date, priority, status, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [projectId, title, desc, dueDate, priority, status, assignee]
                );
            }
            console.log('Sample tasks created and assigned.');
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seed();
