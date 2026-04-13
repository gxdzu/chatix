const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware, adminMiddleware);
router.get('/pending', ctrl.getPendingUsers);
router.get('/users', ctrl.getAllUsers);
router.post('/approve/:userId', ctrl.approveUser);
router.post('/ban/:userId', ctrl.banUser);

module.exports = router;
