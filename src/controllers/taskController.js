const validateTask = require('../utils/validateTask');

function createTaskController(store) {
  function getTasks(req, res) {
    const tasks = store.getTasks();
    res.json(tasks);
  }

  function getTaskById(req, res) {
    const task = store.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı.' });
    }
    res.json(task);
  }

  function createTask(req, res) {
    const { fields, error } = validateTask(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }
    const task = store.createTask(fields);
    res.location(`/tasks/${task.id}`).status(201).json(task);
  }

  function updateTask(req, res) {
    const existingTask = store.getTaskById(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ message: 'Görev bulunamadı.' });
    }
    const { fields, error } = validateTask(req.body, true);
    if (error) {
      return res.status(400).json({ message: error });
    }
    const updatedTask = store.updateTask(req.params.id, fields);
    res.json(updatedTask);
  }

  function deleteTask(req, res) {
    const isDeleted = store.deleteTask(req.params.id);
    if (!isDeleted) {
      return res.status(404).json({ message: 'Görev bulunamadı.' });
    }
    res.status(204).end();
  }

  return { getTasks, getTaskById, createTask, updateTask, deleteTask };
}

module.exports = createTaskController;
