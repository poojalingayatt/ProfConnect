const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');

// All chat routes protected
router.use(authenticate);

router.get('/conversations', chatController.getConversations);
router.post('/start/:facultyId', chatController.startDirectChat);
router.patch('/:id/approve', chatController.approveChat);
router.patch('/:id/reject', chatController.rejectChat);
router.get('/:id/messages', chatController.getMessages);
router.post('/:id/messages', chatController.sendMessage);

module.exports = router;
