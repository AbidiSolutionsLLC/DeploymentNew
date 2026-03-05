const router = require('express').Router();
const ctrl = require('../../controllers/filesController');
const { uploadFile } = require('../../middlewares/uploadMiddleware');
const { isLoggedIn } = require('../../middlewares/authMiddleware');

router.use(isLoggedIn);

router.post('/upload', 
  uploadFile,
  ctrl.upload
);
router.get('/public', ctrl.getPublicFiles);
router.get('/accessible', ctrl.getAccessibleFiles);
router.get('/my-files', ctrl.getMyFiles);
router.get('/shared-with-me', ctrl.getSharedWithMe);
router.get('/:fileId/download', ctrl.downloadUrl);
router.patch('/:fileId/access', ctrl.updateAccess);
router.patch('/:fileId/soft-delete', ctrl.softDeleteFile);

module.exports = router;