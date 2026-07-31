export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'ValidationError' || err.type === 'validation') {
    return res.status(400).json({ success: false, message: err.message, errors: err.errors });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'A record with this value already exists' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  });
}
