const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.userId;

        // Total tasks across all projects user is member of
        const [totalTasks] = await db.query(`
            SELECT COUNT(*) as count 
            FROM tasks t
            JOIN project_members pm ON t.project_id = pm.project_id
            WHERE pm.user_id = ?
        `, [userId]);

        // Tasks by status
        const [statusStats] = await db.query(`
            SELECT status, COUNT(*) as count 
            FROM tasks t
            JOIN project_members pm ON t.project_id = pm.project_id
            WHERE pm.user_id = ?
            GROUP BY status
        `, [userId]);

        // Overdue tasks
        const [overdueTasks] = await db.query(`
            SELECT COUNT(*) as count 
            FROM tasks t
            JOIN project_members pm ON t.project_id = pm.project_id
            WHERE pm.user_id = ? AND t.due_date < CURDATE() AND t.status != 'Done'
        `, [userId]);

        // Tasks per user (for admins) - simplified to just current user's tasks if they want that
        const [userTasks] = await db.query(`
            SELECT COUNT(*) as count 
            FROM tasks
            WHERE assigned_to = ?
        `, [userId]);

        res.json({
            total: totalTasks[0].count,
            byStatus: statusStats,
            overdue: overdueTasks[0].count,
            myTasks: userTasks[0].count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
