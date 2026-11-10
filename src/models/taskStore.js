const fs = require('node:fs');
const path = require('node:path');

function writeJsonFile(filePath, data) {
  // Yazma yarıda kalırsa asıl dosya bozulmasın diye önce geçici dosya kullanılır.
  const temporaryFile = filePath + '.tmp';
  const fileContent = JSON.stringify(data, null, 2);
  fs.writeFileSync(temporaryFile, fileContent + '\n');
  fs.renameSync(temporaryFile, filePath);
}

function createTaskStore(filePath) {
  const counterFile = path.join(path.dirname(filePath), 'task-counter.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]\n', { flag: 'wx' });
  }

  function getTasks() {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const tasks = JSON.parse(fileContent);
    if (!Array.isArray(tasks)) {
      throw new Error('Görev dosyası bir JSON dizisi olmalıdır.');
    }
    return tasks;
  }

  function saveTasks(tasks) {
    writeJsonFile(filePath, tasks);
  }

  function getNextId(tasks) {
    let lastId = 0;
    if (fs.existsSync(counterFile)) {
      lastId = JSON.parse(fs.readFileSync(counterFile, 'utf8'));
      if (!Number.isSafeInteger(lastId) || lastId < 0) {
        throw new Error('Görev sayacı geçerli bir sayı olmalıdır.');
      }
    }
    for (const task of tasks) {
      if (Number.isSafeInteger(task.id) && task.id > lastId) {
        lastId = task.id;
      }
    }
    const nextId = lastId + 1;
    writeJsonFile(counterFile, nextId);
    return nextId;
  }

  function getTaskById(id) {
    const tasks = getTasks();
    return tasks.find(task => String(task.id) === id);
  }

  function createTask(fields) {
    const tasks = getTasks();
    const now = new Date().toISOString();
    const task = {
      id: getNextId(tasks),
      title: fields.title,
      description: fields.description ?? '',
      status: fields.status ?? 'pending',
      priority: fields.priority ?? 'medium',
      assignee: fields.assignee ?? '',
      createdAt: now,
      updatedAt: now,
    };
    tasks.push(task);
    saveTasks(tasks);
    return task;
  }

  function updateTask(id, fields) {
    const tasks = getTasks();
    const taskIndex = tasks.findIndex(task => String(task.id) === id);
    if (taskIndex === -1) {
      return null;
    }
    const updatedTask = {
      ...tasks[taskIndex],
      ...fields,
      updatedAt: new Date().toISOString(),
    };
    tasks[taskIndex] = updatedTask;
    saveTasks(tasks);
    return updatedTask;
  }

  function deleteTask(id) {
    const tasks = getTasks();
    const taskIndex = tasks.findIndex(task => String(task.id) === id);
    if (taskIndex === -1) {
      return false;
    }
    tasks.splice(taskIndex, 1);
    saveTasks(tasks);
    return true;
  }

  // Başlangıçta dosyayı kontrol et; bozuk verinin üzerine boş liste yazma.
  getTasks();

  return { getTasks, getTaskById, createTask, updateTask, deleteTask };
}

module.exports = createTaskStore;
