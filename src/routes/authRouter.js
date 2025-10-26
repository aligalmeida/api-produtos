const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

/**
 * POST /auth/login
 * body: { username, password }
 * return: { token }
 */
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const expectedUser = process.env.AUTH_USERNAME;
  const expectedPass = process.env.AUTH_PASSWORD;

  if (!username || !password) {
    return res.status(422).json({ msg: 'Informe username e password' });
    }

  if (username !== expectedUser || password !== expectedPass) {
    return res.status(401).json({ msg: 'Credenciais inválidas' });
  }

  const token = jwt.sign(
    { username },
    process.env.JWT_SECRET,
    { subject: username, expiresIn: '1h' }
  );

  return res.status(200).json({ token });
});

module.exports = router;
