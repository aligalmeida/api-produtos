const jwt = require('jsonwebtoken');

function verificarJWT(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ msg: 'Token ausente ou malformado' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, username: payload.username };
    return next();
  } catch {
    return res.status(401).json({ msg: 'Token inválido ou expirado' });
  }
}

module.exports = { verificarJWT };
