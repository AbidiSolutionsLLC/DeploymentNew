const express = require('express');
const router = express.Router();
const projectGroupController = require('../../controllers/projectGroupController');

router.route('/')
  .post(projectGroupController.createGroup)
  .get(projectGroupController.getAllGroups);

router.route('/:id')
  .get(projectGroupController.getGroupById)
  .put(projectGroupController.updateGroup)
  .delete(projectGroupController.deleteGroup);

module.exports = router;
