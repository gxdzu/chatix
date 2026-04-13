const router = require('express').Router();
const ctrl = require('../controllers/chats.controller');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', ctrl.getMyChats);
router.get('/:chatId/members', ctrl.getChatMembers);
router.post('/direct', ctrl.createDirect);
router.post('/:chatId/read', ctrl.markRead);

module.exports = router;
