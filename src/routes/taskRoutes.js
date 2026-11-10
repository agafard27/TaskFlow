const express = require('express');

const router = express.Router();
const createTaskController = require('../controllers/taskController');


function createTaskRoutes(store) {
  
  const controller = createTaskController(store);

  router.get('/', controller.getTasks);
  router.post('/', controller.createTask);
  router.get('/:id', controller.getTaskById);
  router.put('/:id', controller.updateTask);
  router.delete('/:id', controller.deleteTask);

  return router;
}

module.exports = createTaskRoutes;
