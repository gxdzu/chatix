const router = require('express').Router();
const ctrl = require('../controllers/messages.controller');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/:chatId', ctrl.getMessages);
router.get('/:chatId/search', ctrl.searchMessages);
router.patch('/:messageId', ctrl.editMessage);
router.delete('/:messageId', ctrl.deleteMessage);
router.post('/:messageId/reactions', ctrl.addReaction);

module.exports = router;
