const router = require('express').Router();
const ctrl = require('../../controllers/folderController');
const { uploadFolderThumbnail } = require('../../middlewares/uploadMiddleware');
const validate = require('../../middlewares/validationMiddleware');
const { folderSchema } = require('../../JoiSchema/FolderJoiSchema');

router.post('/', uploadFolderThumbnail, validate(folderSchema), ctrl.create);
router.get('/:id/contents', ctrl.getContents);
router.patch('/folders/:folderId/soft-delete', ctrl.softDeleteFolder);

module.exports = router;