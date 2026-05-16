const db = require('../config/db');

exports.getNotifications = async (req, res) => {
    try {
        // Run lazy due-date check
        await checkDueDates(req.user.id);

        const [notifications] = await db.query(
            `SELECT n.*, u.name as sender_name 
             FROM notifications n 
             LEFT JOIN users u ON n.sender_id = u.id 
             WHERE n.user_id = ? 
             ORDER BY n.created_at DESC`,
            [req.user.id]
        );
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
};

const checkDueDates = async (userId) => {
    try {
        // 1. Get tasks due today or tomorrow that aren't 'Done' and haven't alerted yet
        // We'll use a simple approach: if no notification of type 'due_soon' or 'overdue' exists for this task in last 24h
        const [tasks] = await db.query(`
            SELECT t.*, p.name as project_name, pm.user_id as admin_id
            FROM tasks t
            JOIN projects p ON t.project_id = p.id
            JOIN project_members pm ON p.id = pm.project_id AND pm.role = 'Admin'
            WHERE (t.assigned_to = ? OR pm.user_id = ?)
            AND t.status != 'Done'
            AND t.due_date <= DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        `, [userId, userId]);

        for (const task of tasks) {
            const isOverdue = new Date(task.due_date) < new Date();
            const type = isOverdue ? 'task_overdue' : 'task_due_soon';
            const message = isOverdue 
                ? `ALERT: Task "${task.title}" in project "${task.project_name}" is OVERDUE!`
                : `Reminder: Task "${task.title}" is due soon (Deadline: ${task.due_date.toLocaleDateString()})`;

            // Check if we already sent this alert today
            const [existing] = await db.query(
                'SELECT id FROM notifications WHERE task_id = ? AND type = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)',
                [task.id, type]
            );

            if (existing.length === 0) {
                // Notify Assigned User
                if (task.assigned_to) {
                    await db.query(
                        'INSERT INTO notifications (user_id, project_id, task_id, type, message) VALUES (?, ?, ?, ?, ?)',
                        [task.assigned_to, task.project_id, task.id, type, message]
                    );
                }
                // Notify Admin (if different from assigned user)
                if (task.admin_id !== task.assigned_to) {
                    await db.query(
                        'INSERT INTO notifications (user_id, project_id, task_id, type, message) VALUES (?, ?, ?, ?, ?)',
                        [task.admin_id, task.project_id, task.id, type, message]
                    );
                }
            }
        }
    } catch (error) {
        console.error('Error checking due dates:', error);
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification' });
    }
};

exports.handleAssignmentRequest = async (req, res) => {
    const { action } = req.body; 
    const requestId = req.params.id;

    try {
        const [requests] = await db.query(
            'SELECT ar.*, t.project_id FROM assignment_requests ar JOIN tasks t ON ar.task_id = t.id WHERE ar.id = ?',
            [requestId]
        );

        if (requests.length === 0) return res.status(404).json({ message: 'Request not found' });
        const request = requests[0];

        const [member] = await db.query(
            'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
            [request.project_id, req.user.id]
        );

        if (!member.length || member[0].role !== 'Admin') {
            return res.status(403).json({ message: 'Only admins can approve requests' });
        }

        if (action === 'accept') {
            await db.query('UPDATE tasks SET assigned_to = ? WHERE id = ?', [request.user_id, request.task_id]);
            await db.query('UPDATE assignment_requests SET status = "Accepted" WHERE id = ?', [requestId]);
            
            await db.query(
                'INSERT INTO notifications (user_id, sender_id, project_id, task_id, type, message) VALUES (?, ?, ?, ?, ?, ?)',
                [request.user_id, req.user.id, request.project_id, request.task_id, 'assignment_approved', 'Your self-assignment request was approved.']
            );
        } else {
            await db.query('UPDATE assignment_requests SET status = "Declined" WHERE id = ?', [requestId]);
            
            await db.query(
                'INSERT INTO notifications (user_id, sender_id, project_id, task_id, type, message) VALUES (?, ?, ?, ?, ?, ?)',
                [request.user_id, req.user.id, request.project_id, request.task_id, 'assignment_declined', 'Your self-assignment request was declined.']
            );
        }

        await db.query('DELETE FROM notifications WHERE type = "self_assignment_request" AND data->>"$.requestId" = ?', [requestId]);

        res.json({ message: `Request ${action}ed successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing request' });
    }
};
