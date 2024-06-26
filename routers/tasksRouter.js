const express = require('express');
const authController = require('../controllers/authController.js');
const tasksController = require('../controllers/tasksController.js');

const router = express.Router();

router
  .route('/')
  .post(
    authController.restrict('admin', 'tasks-manager'),
    tasksController.createTask
  )
  .get(
    authController.restrict('admin', 'tasks-manager'),
    tasksController.getAllTask
  );

router
  .route('/:id')
  .put(
    authController.restrict('tasks-manager', 'admin'),
    tasksController.editTask
  )
  .delete(
    authController.restrict('tasks-manager', 'admin'),
    tasksController.cancelTask
  )
  .get(tasksController.getTask)
  .post(
    authController.restrict('tasks-manager', 'admin'),
    tasksController.markTaskAsDone
  );

router
  .route('/:id/me')
  .post(authController.restrict('worker'), tasksController.addMeToTask)
  .delete(authController.restrict('worker'), tasksController.removeMeFromTask)
  .put(authController.restrict('worker'), tasksController.doneMyWork);

router
  .route('/me')
  .get(
    authController.restrict('worker', 'admin', 'tasks-manager'),
    tasksController.getMyTask
  );

module.exports = router;
