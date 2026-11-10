function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Geçerli bir JSON gövdesi gönderin.' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'İstek gövdesi 100 KB sınırını aşıyor.' });
  }

  console.error(err);
  res.status(500).json({ message: 'Sunucu hatası oluştu.' });
}

module.exports = errorHandler;
