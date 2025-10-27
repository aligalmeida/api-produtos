// tests/integration/produtos.routes.test.js
const { connect, closeDatabase, clearDatabase } = require('../setup/db');
const { app, request, loginAndGetToken } = require('../utils/testApp');
const Produto = require('../../src/models/produtoModel');

describe('Produtos Routes/Controllers', () => {
  let agent;
  let token;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-test';
    process.env.AUTH_USERNAME = 'admin';
    process.env.AUTH_PASSWORD = 'admin123';
    await connect();
    agent = request(app);
    token = await loginAndGetToken(agent);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test('GET /api/v1/produtos - lista vazia inicialmente', async () => {
    const res = await agent
      .get('/api/v1/produtos')
      .set('Accept', 'application/json'); // <-- CORREÇÃO: Força a resposta JSON

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  test('POST /api/v1/produtos - cria produto (201 + Location)', async () => {
    const res = await agent
      .post('/api/v1/produtos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome: 'Teclado',
        preco: 199.9,
        categoria: 'outros',
        estoque: 10,
        ativo: true
      });
    expect(res.status).toBe(201);
    expect(res.headers.location).toMatch(/\/api\/v1\/produtos\/[a-f0-9]{24}$/i);
    expect(res.body._id).toBeDefined();
    expect(res.body.nome).toBe('Teclado');
  });

  test('GET /api/v1/produtos - lista com 1 item após criação', async () => {
    await Produto.create({ nome: 'Mouse', nomeLower: 'mouse', preco: 99.9, categoria: 'outros' });
    
    const res = await agent
      .get('/api/v1/produtos')
      .set('Accept', 'application/json'); // <-- CORREÇÃO: Força a resposta JSON

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].nome).toBe('Mouse');
  });

  test('GET /api/v1/produtos/:id - retorna item existente', async () => {
    const p = await Produto.create({ nome: 'Monitor', nomeLower: 'monitor', preco: 899.9, categoria: 'outros' });
    
    // Esta rota (exibir) não precisa do 'Accept' pois sempre retorna JSON
    const res = await agent.get(`/api/v1/produtos/${p._id}`); 
    
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Monitor');
  });

  test('PUT /api/v1/produtos/:id - atualiza totalmente', async () => {
    const p = await Produto.create({ nome: 'SSD', nomeLower: 'ssd', preco: 299.99, categoria: 'outros' });
    const res = await agent
      .put(`/api/v1/produtos/${p._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome: 'SSD NVMe',
        preco: 399.99,
        categoria: 'outros',
        estoque: 5,
        ativo: true
      });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('SSD NVMe');
    expect(res.body.estoque).toBe(5);
  });

  test('PATCH /api/v1/produtos/:id - atualiza parcialmente', async () => {
    const p = await Produto.create({ nome: 'Notebook', nomeLower: 'notebook', preco: 3500, categoria: 'outros', estoque: 2 });
    const res = await agent
      .patch(`/api/v1/produtos/${p._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estoque: 7 });
    expect(res.status).toBe(200);
    expect(res.body.estoque).toBe(7);
  });

  test('DELETE /api/v1/produtos/:id - bloqueia remoção com estoque > 0 (409)', async () => {
    const p = await Produto.create({ nome: 'Cadeira', nomeLower: 'cadeira', preco: 450, categoria: 'outros', estoque: 1 });
    const res = await agent
      .delete(`/api/v1/produtos/${p._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
  });

  test('DELETE /api/v1/produtos/:id - remove com estoque = 0 (204)', async () => {
    const p = await Produto.create({ nome: 'Mesa', nomeLower: 'mesa', preco: 750, categoria: 'outros', estoque: 0 });
    const res = await agent
      .delete(`/api/v1/produtos/${p._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
    const existe = await Produto.findById(p._id);
    expect(existe).toBeNull();
  });

  test('POST /api/v1/produtos - 401 sem token', async () => {
    const res = await agent
      .post('/api/v1/produtos')
      .send({ nome: 'Fonte', preco: 250 });
    expect(res.status).toBe(401);
  });

  test('POST /api/v1/produtos - 422 validação de entrada', async () => {
    const res = await agent
      .post('/api/v1/produtos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'A', preco: -10 }); // inválidos
    expect(res.status).toBe(422);
  });

  test('POST /api/v1/produtos - 409 nome duplicado', async () => {
    await Produto.create({ nome: 'Headset', nomeLower: 'headset', preco: 199, categoria: 'outros' });
    const res = await agent
      .post('/api/v1/produtos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Headset', preco: 199, categoria: 'outros' });
    expect(res.status).toBe(409);
  });
});