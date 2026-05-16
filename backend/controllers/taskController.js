const db = require('../config/db');

exports.createTask = async (req, res) => {
    try {
        const { project_id, title, description, due_date, priority, assigned_to } = req.body;
        const userId = req.user.id;

        // Check if user is member of project
        const [memberCheck] = await db.query('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [project_id, userId]);
        if (memberCheck.length === 0) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const role = memberCheck[0].role;
        let finalAssignee = assigned_to;
        let needsApproval = false;

        if (role === 'Member') {
            // Members can ONLY assign to themselves
            if (assigned_to && assigned_to !== userId) {
                return res.status(403).json({ message: 'Members can only assign tasks to themselves' });
            }
            if (assigned_to === userId) {
                needsApproval = true;
                finalAssignee = null; // Stays null until approved
            }
        }

        const [result] = await db.query(
            'INSERT INTO tasks (project_id, title, description, due_date, priority, assigned_to) VALUES (?, ?, ?, ?, ?, ?)',
            [project_id, title, description, due_date, priority, finalAssignee]
        );
        const taskId = result.insertId;

        if (needsApproval) {
            // Create assignment request
            const [requestResult] = await db.query(
                'INSERT INTO assignment_requests (task_id, user_id) VALUES (?, ?)',
                [taskId, userId]
            );
            const requestId = requestResult.insertId;

            // Notify all Admins of the project
            const [admins] = await db.query(
                'SELECT user_id FROM project_members WHERE project_id = ? AND role = "Admin"',
                [project_id]
            );

            for (const admin of admins) {
                await db.query(
                    'INSERT INTO notifications (user_id, sender_id, project_id, task_id, type, message, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                        admin.user_id, 
                        userId, 
                        project_id, 
                        taskId, 
                        'self_assignment_request', 
                        `Member wants to assign task "${title}" to themselves.`,
                        JSON.stringify({ requestId, taskId, userId })
                    ]
                );
            }
        } else if (assigned_to && assigned_to !== userId) {
            // Notify the assigned user
            await db.query(
                'INSERT INTO notifications (user_id, sender_id, project_id, task_id, type, message) VALUES (?, ?, ?, ?, ?, ?)',
                [assigned_to, userId, project_id, taskId, 'task_assigned', `New task "${title}" assigned to you.`]
            );
        }

        res.status(201).json({ id: taskId, ...req.body, assigned_to: finalAssignee });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, due_date, priority, assigned_to } = req.body;
        const userId = req.user.id;

        // Get task and check role
        const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
        if (tasks.length === 0) return res.status(404).json({ message: 'Task not found' });
        
        const task = tasks[0];
        const [memberCheck] = await db.query('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [task.project_id, userId]);
        
        if (memberCheck.length === 0 || memberCheck[0].role !== 'Admin') {
            return res.status(403).json({ message: 'Only admins can update task details' });
        }

        const oldAssignee = task.assigned_to;
        await db.query(
            'UPDATE tasks SET title = ?, description = ?, due_date = ?, priority = ?, assigned_to = ? WHERE id = ?',
            [title, description, due_date, priority, assigned_to, id]
        );

        if (assigned_to && assigned_to !== oldAssignee) {
            // Notify new assignee
            await db.query(
                'INSERT INTO notifications (user_id, sender_id, project_id, task_id, type, message) VALUES (?, ?, ?, ?, ?, ?)',
                [assigned_to, userId, task.project_id, id, 'task_assigned', `Task "${title}" has been reassigned to you.`]
            );
        }

        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;

        const [memberCheck] = await db.query('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
        if (memberCheck.length === 0) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const role = memberCheck[0].role;
        let query = `
            SELECT t.*, u.name as assignee_name, ar.status as request_status
            FROM tasks t 
            LEFT JOIN users u ON t.assigned_to = u.id 
            LEFT JOIN assignment_requests ar ON t.id = ar.task_id AND ar.status = 'Pending'
            WHERE t.project_id = ?
        `;
        let params = [projectId];

        if (role === 'Member') {
            // Members see tasks assigned to them OR unassigned tasks
            query += ' AND (t.assigned_to = ? OR t.assigned_to IS NULL)';
            params.push(userId);
        }

        const [tasks] = await db.query(query, params);
        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
        if (tasks.length === 0) return res.status(404).json({ message: 'Task not found' });

        const task = tasks[0];
        const [memberCheck] = await db.query('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [task.project_id, userId]);
        
        if (memberCheck.length === 0) return res.status(403).json({ message: 'Access denied' });

        const role = memberCheck[0].role;
        if (role === 'Member' && task.assigned_to !== userId) {
            return res.status(403).json({ message: 'You can only update tasks assigned to you' });
        }

        await db.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
