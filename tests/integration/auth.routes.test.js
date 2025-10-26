const { connect, closeDatabase, clearDatabase } = require('../setup/db');
const { app, request } = require('../utils/testApp');

describe('Auth Routes', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-test';
    process.env.AUTH_USERNAME = 'admin';
    process.env.AUTH_PASSWORD = 'admin123';
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test('POST /api/v1/auth/login - deve retornar 200 e token com credenciais válidas', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/v1/auth/login - 401 com credenciais inválidas', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'x', password: 'y' });

    expect(res.status).toBe(401);
  });

  test('POST /api/v1/auth/login - 422 se faltar campos', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin' });

    expect(res.status).toBe(422);
  });
});
