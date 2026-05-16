const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectDetails);
router.post('/:id/members', projectController.addMember);
router.delete('/:id/members/:userId', projectController.removeMember);
router.patch('/:id/members/:userId/role', projectController.updateMemberRole);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
