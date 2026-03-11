function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.auth?.role;
    if (!role) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(role)) return res.status(403).json({ message: 'Forbidden' });
    return next();
  };
}

module.exports = { requireRole };
