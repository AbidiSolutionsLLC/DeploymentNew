const express = require('express');
const router = express.Router();
const projectGroupController = require('../../controllers/projectGroupController');
const { restrictTo } = require('../../middlewares/authMiddleware');

router.route('/')
  .post(restrictTo('Super Admin', 'Admin'), projectGroupController.createGroup)
  .get(projectGroupController.getAllGroups);

router.route('/:id')
  .get(projectGroupController.getGroupById)
  .put(projectGroupController.updateGroup)
  .delete(restrictTo('Super Admin', 'Admin'), projectGroupController.deleteGroup);

module.exports = router;
