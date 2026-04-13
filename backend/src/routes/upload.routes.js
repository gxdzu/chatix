const router = require('express').Router();
const { uploadMiddleware, uploadFile } = require('../controllers/upload.controller');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.post('/', uploadMiddleware, uploadFile);

module.exports = router;
