const express = require('express');
const router = express.Router();
const projectGroupController = require('../../controllers/projectGroupController');
const { restrictToProjectRole } = require('../../middlewares/authMiddleware');

router.route('/')
  .post(restrictToProjectRole('Project Administrator'), projectGroupController.createGroup)
  .get(projectGroupController.getAllGroups);

router.route('/:id')
  .get(projectGroupController.getGroupById)
  .put(projectGroupController.updateGroup)
  .delete(restrictToProjectRole('Project Administrator'), projectGroupController.deleteGroup);

module.exports = router;
