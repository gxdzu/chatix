const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 32 }).matches(/^[a-z0-9_]+$/i),
  body('display_name').trim().isLength({ min: 1, max: 64 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
], validate, ctrl.register);

router.post('/login', [
  body('login').trim().notEmpty(),
  body('password').notEmpty(),
], validate, ctrl.login);

router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/me', authMiddleware, ctrl.me);

module.exports = router;
