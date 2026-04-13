const router = require('express').Router();
const ctrl = require('../controllers/users.controller');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/sessions', ctrl.getSessions);
router.delete('/sessions/:sessionId', ctrl.revokeSession);
router.put('/profile', ctrl.updateProfile);
router.put('/password', ctrl.changePassword);
router.get('/:userId', ctrl.getProfile);

module.exports = router;
