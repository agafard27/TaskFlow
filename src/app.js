const express = require('express');
const path = require('node:path');
const createTaskStore = require('./models/taskStore');
const createTaskRoutes = require('./routes/taskRoutes');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Ayrı bir uygulama fonksiyonu, testlerin geçici veri dosyası kullanmasını sağlar.
function createApp({ dataFile = path.join(__dirname, '../data/tasks.json') } = {}) {
  const app = express();
  const store = createTaskStore(dataFile);

  app.use(logger);
  app.use(express.json({ limit: '100kb' }));

  app.get('/', (req, res) => {
    res.json({ message: 'TaskFlow API çalışıyor.', tasks: '/tasks' });
  });
  app.use('/tasks', createTaskRoutes(store));

  app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint bulunamadı.' });
  });
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
