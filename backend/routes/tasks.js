const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', taskController.createTask);
router.get('/project/:projectId', taskController.getProjectTasks);
router.put('/:id', taskController.updateTask);
router.patch('/:id/status', taskController.updateTaskStatus);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
