// src/routes/authRouter.js
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Autentica e gera um token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 example: "admin123"
 *     responses:
 *       200:
 *         description: Token emitido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Credenciais inválidas
 *       422:
 *         description: Requisição inválida (faltando campos)
 */
router.post('/login', (req, res) => {
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


