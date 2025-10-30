const { body, validationResult } = require('express-validator');

const validarLogin = [
  body('username')
    .exists({ checkFalsy: true }).withMessage('username é obrigatório')
    .isString().withMessage('username deve ser string'),
  body('password')
    .exists({ checkFalsy: true }).withMessage('password é obrigatório')
    .isString().withMessage('password deve ser string'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        msg: 'Dados inválidos',
        erros: errors.array().map(e => ({ field: e.param, msg: e.msg }))
      });
    }
    next();
  }
];

module.exports = { validarLogin };

