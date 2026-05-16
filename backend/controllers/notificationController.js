const db = require('../config/db');

exports.getNotifications = async (req, res) => {
    try {
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
        res.status(500).json({ message: 'Error fetching notifications' });
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
    const { action } = req.body; // 'accept' or 'decline'
    const requestId = req.params.id;

    try {
        // 1. Get request details
        const [requests] = await db.query(
            'SELECT ar.*, t.project_id FROM assignment_requests ar JOIN tasks t ON ar.task_id = t.id WHERE ar.id = ?',
            [requestId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const request = requests[0];

        // 2. Check if user is Admin of the project
        const [member] = await db.query(
            'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
            [request.project_id, req.user.id]
        );

        if (!member.length || member[0].role !== 'Admin') {
            return res.status(403).json({ message: 'Only admins can approve requests' });
        }

        if (action === 'accept') {
            // Update task assignment
            await db.query('UPDATE tasks SET assigned_to = ? WHERE id = ?', [request.user_id, request.task_id]);
            await db.query('UPDATE assignment_requests SET status = "Accepted" WHERE id = ?', [requestId]);
            
            // Notify member
            await db.query(
                'INSERT INTO notifications (user_id, sender_id, task_id, type, message) VALUES (?, ?, ?, ?, ?)',
                [request.user_id, req.user.id, request.task_id, 'assignment_approved', 'Your self-assignment request was approved.']
            );
        } else {
            await db.query('UPDATE assignment_requests SET status = "Declined" WHERE id = ?', [requestId]);
            
            // Notify member
            await db.query(
                'INSERT INTO notifications (user_id, sender_id, task_id, type, message) VALUES (?, ?, ?, ?, ?)',
                [request.user_id, req.user.id, request.task_id, 'assignment_declined', 'Your self-assignment request was declined.']
            );
        }

        // Delete the notification that triggered this
        await db.query('DELETE FROM notifications WHERE type = "self_assignment_request" AND data->>"$.requestId" = ?', [requestId]);

        res.json({ message: `Request ${action}ed successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing request' });
    }
};
