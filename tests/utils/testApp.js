const request = require('supertest');
const { app } = require('../../src/server');

async function loginAndGetToken(agent) {
  const username = process.env.AUTH_USERNAME || 'admin';
  const password = process.env.AUTH_PASSWORD || 'admin123';

  const res = await agent
    .post('/api/v1/auth/login')
    .send({ username, password });

  expect(res.status).toBe(200);
  expect(res.body.token).toBeDefined();
  return res.body.token;
}

module.exports = { app, request, loginAndGetToken };
