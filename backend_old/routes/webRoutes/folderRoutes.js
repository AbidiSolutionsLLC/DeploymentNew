const router = require('express').Router();
const ctrl = require('../../controllers/folderController');
const { uploadFolderThumbnail } = require('../../middlewares/uploadMiddleware');

router.post('/', uploadFolderThumbnail, ctrl.create);
router.get('/:id/contents', ctrl.getContents);
router.patch('/folders/:folderId/soft-delete', ctrl.softDeleteFolder);

module.exports = router;