const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, notificationController.getNotifications);
router.delete('/clear', auth, notificationController.clearAll);
router.put('/:id/read', auth, notificationController.markAsRead);
router.post('/requests/:id/handle', auth, notificationController.handleAssignmentRequest);

module.exports = router;
