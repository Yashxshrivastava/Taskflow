const db = require('../config/db');

exports.createProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        const creator_id = req.user.id;

        if (!name) {
            return res.status(400).json({ message: 'Project name is required' });
        }

        const [result] = await db.query('INSERT INTO projects (name, description, creator_id) VALUES (?, ?, ?)', [name, description, creator_id]);
        const projectId = result.insertId;

        // Add creator as Admin
        await db.query('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [projectId, creator_id, 'Admin']);

        res.status(201).json({ id: projectId, name, description, role: 'Admin' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProjects = async (req, res) => {
    try {
        const userId = req.user.id;
        const [projects] = await db.query(`
            SELECT p.*, pm.role,
            (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
            (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'Done') as completed_tasks
            FROM projects p 
            JOIN project_members pm ON p.id = pm.project_id 
            WHERE pm.user_id = ?
        `, [userId]);

        // Add percentage calculation
        const projectsWithProgress = projects.map(p => ({
            ...p,
            completion_percentage: p.total_tasks > 0 ? Math.round((p.completed_tasks / p.total_tasks) * 100) : 0
        }));

        res.json(projectsWithProgress);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProjectDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [project] = await db.query(`
            SELECT p.*, pm.role 
            FROM projects p 
            JOIN project_members pm ON p.id = pm.project_id 
            WHERE p.id = ? AND pm.user_id = ?
        `, [id, userId]);

        if (project.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const [members] = await db.query(`
            SELECT u.id, u.name, u.email, pm.role 
            FROM users u 
            JOIN project_members pm ON u.id = pm.user_id 
            WHERE pm.project_id = ?
        `, [id]);

        res.json({ ...project[0], members });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addMember = async (req, res) => {
    try {
        const { id } = req.params; // project id
        const { email, role } = req.body;
        const adminId = req.user.id;

        // Check if requester is Admin
        const [adminCheck] = await db.query('SELECT * FROM project_members WHERE project_id = ? AND user_id = ? AND role = "Admin"', [id, adminId]);
        if (adminCheck.length === 0) {
            return res.status(403).json({ message: 'Only admins can add members' });
        }

        // Find user by email
        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newMemberId = users[0].id;

        // Check if already a member
        const [memberCheck] = await db.query('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?', [id, newMemberId]);
        if (memberCheck.length > 0) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        await db.query('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [id, newMemberId, role || 'Member']);

        res.json({ message: 'Member added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.removeMember = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const adminId = req.user.id;

        // Check if requester is Admin
        const [adminCheck] = await db.query('SELECT * FROM project_members WHERE project_id = ? AND user_id = ? AND role = "Admin"', [id, adminId]);
        if (adminCheck.length === 0) {
            return res.status(403).json({ message: 'Only admins can remove members' });
        }

        // Cannot remove self if last admin
        if (userId == adminId) {
            const [admins] = await db.query('SELECT * FROM project_members WHERE project_id = ? AND role = "Admin"', [id]);
            if (admins.length <= 1) {
                return res.status(400).json({ message: 'Cannot remove the only admin' });
            }
        }

        await db.query('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [id, userId]);
        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateMemberRole = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const { role } = req.body;
        const adminId = req.user.id;

        const [adminCheck] = await db.query('SELECT * FROM project_members WHERE project_id = ? AND user_id = ? AND role = "Admin"', [id, adminId]);
        if (adminCheck.length === 0) {
            return res.status(403).json({ message: 'Only admins can update roles' });
        }

        await db.query('UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?', [role, id, userId]);
        res.json({ message: 'Role updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        // Check if requester is Admin
        const [adminCheck] = await db.query('SELECT * FROM project_members WHERE project_id = ? AND user_id = ? AND role = "Admin"', [id, adminId]);
        if (adminCheck.length === 0) {
            return res.status(403).json({ message: 'Only admins can delete projects' });
        }

        // Transactions would be better here, but simple sequential deletes for now
        await db.query('DELETE FROM tasks WHERE project_id = ?', [id]);
        await db.query('DELETE FROM project_members WHERE project_id = ?', [id]);
        await db.query('DELETE FROM projects WHERE id = ?', [id]);

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const adminId = req.user.id;

        // Check if requester is Admin
        const [adminCheck] = await db.query('SELECT * FROM project_members WHERE project_id = ? AND user_id = ? AND role = "Admin"', [id, adminId]);
        if (adminCheck.length === 0) {
            return res.status(403).json({ message: 'Only admins can update project details' });
        }

        if (!name) {
            return res.status(400).json({ message: 'Project name is required' });
        }

        await db.query('UPDATE projects SET name = ?, description = ? WHERE id = ?', [name, description, id]);
        res.json({ message: 'Project updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
