// tests/unit/auth.middleware.test.js
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const { verificarJWT } = require('../../src/middleware/auth');

function runMw(mw, req) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200, body: null,
      status(c){ this.statusCode = c; return this; },
      json(o){ this.body = o; return this; },
    };
    mw(req, res, () => resolve({ next: true, res }));
    // caso responda sem next()
    setImmediate(() => resolve({ next: false, res }));
  });
}

describe('Auth Middleware (unit)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('401 quando header ausente', async () => {
    const { next, res } = await runMw(verificarJWT, { headers: {} });
    expect(next).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.body.msg).toMatch(/Token ausente/i);
  });

  test('401 quando malformado (sem Bearer)', async () => {
    const { next, res } = await runMw(verificarJWT, {
      headers: { authorization: 'Invalid abc' },
    });
    expect(next).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  test('401 quando inválido/expirado', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('bad'); });
    const { next, res } = await runMw(verificarJWT, {
      headers: { authorization: 'Bearer xyz' },
    });
    expect(next).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.body.msg).toMatch(/inválido|expirado/i);
  });

  test('next() quando válido', async () => {
    jwt.verify.mockReturnValue({ sub: 'admin', username: 'admin' });
    const req = { headers: { authorization: 'Bearer good' } };
    const result = await runMw(verificarJWT, req);
    expect(result.next).toBe(true);
    expect(req.user).toEqual({ id: 'admin', username: 'admin' });
  });
});

