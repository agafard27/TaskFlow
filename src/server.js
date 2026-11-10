const createApp = require('./app');

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT, 1 ile 65535 arasında bir tam sayı olmalıdır.');
}

const app = createApp();
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`TaskFlow API: http://localhost:${port}`);
});

server.on('error', err => {
  console.error(`Sunucu başlatılamadı: ${err.message}`);
  process.exitCode = 1;
});
