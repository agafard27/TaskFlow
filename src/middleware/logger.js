// next(), isteği sıradaki middleware veya route'a aktarır.
function logger(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
}

module.exports = logger;
