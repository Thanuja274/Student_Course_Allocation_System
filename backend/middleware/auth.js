const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    res.status(401).json({ error: msg });
  }
};

const authorize = role => (req, res, next) => {
  if (req.user.role !== role)
    return res.status(403).json({ error: `Access denied. ${role} role required.` });
  next();
};

module.exports = { authenticate, authorize };
