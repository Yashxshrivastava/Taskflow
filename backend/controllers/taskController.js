const db = require('../config/db');

exports.createTask = async (req, res) => {
    try {
        const { project_id, title, description, due_date, priority, assigned_to } = req.body;
        const userId = req.userId;

        // Check if user is Admin of project
        const [memberCheck] = await db.query('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [project_id, userId]);
        if (memberCheck.length === 0) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (memberCheck[0].role !== 'Admin') {
            return res.status(403).json({ message: 'Only project admins can create tasks' });
        }

        const [result] = await db.query(
            'INSERT INTO tasks (project_id, title, description, due_date, priority, assigned_to) VALUES (?, ?, ?, ?, ?, ?)',
            [project_id, title, description, due_date, priority, assigned_to]
        );

        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.userId;

        const [memberCheck] = await db.query('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
        if (memberCheck.length === 0) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const role = memberCheck[0].role;
        let query = 'SELECT t.*, u.name as assignee_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.project_id = ?';
        let params = [projectId];

        if (role === 'Member') {
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
        const userId = req.userId;

        // Find task and check permissions
        const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
        if (tasks.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const task = tasks[0];
        const [memberCheck] = await db.query('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [task.project_id, userId]);
        
        if (memberCheck.length === 0) {
            return res.status(403).json({ message: 'Access denied' });
        }

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
