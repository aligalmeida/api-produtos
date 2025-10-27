// tests/unit/produtos.controller.test.js
jest.mock('../../src/models/produtoModel', () => {
  return {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
});

const Produto = require('../../src/models/produtoModel');
const ctrl = require('../../src/controllers/produtosController');

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.headers = {};
  res.body = null;
  res.status = function (code) { this.statusCode = code; return this; };
  res.json = function (obj) { this.body = obj; return this; };
  res.send = function (obj) { this.body = obj ?? null; return this; };
  res.setHeader = function (k, v) { this.headers[k] = v; };
  res.type = function () { return this; };
  return res;
}

// helpers para encadeamentos do mongoose
const setFindOneLean = (value) => {
  Produto.findOne.mockReturnValue({
    lean: () => Promise.resolve(value),
  });
};

const setFindSortLean = (arr) => {
  Produto.find.mockReturnValue({
    sort: () => ({
      lean: () => Promise.resolve(arr),
    }),
  });
};

describe('Produtos Controller (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('criar -> 201 com Location quando ok', async () => {
    setFindOneLean(null); // não existe duplicado
    Produto.create.mockResolvedValue({ _id: '64f000000000000000000001', nome: 'Teclado' });

    const req = {
      baseUrl: '/api/v1/produtos',
      body: { nome: 'Teclado', preco: 199.9, categoria: 'outros', estoque: 10, ativo: true },
    };
    const res = mockRes();

    await ctrl.criar(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.headers['Location']).toBe('/api/v1/produtos/64f000000000000000000001');
    expect(res.body._id).toBeDefined();
    expect(Produto.create).toHaveBeenCalled();
  });

  test('criar -> 409 quando nome duplicado', async () => {
    setFindOneLean({ _id: 'x' }); // já existe

    const res = mockRes();
    await ctrl.criar({ body: { nome: 'Headset', preco: 199 } }, res);

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ msg: 'Já existe um produto com este nome' });
  });

  test('criar -> 422 quando Model lança erro de validação', async () => {
    setFindOneLean(null);
    Produto.create.mockRejectedValue(new Error('ValidationError'));

    const res = mockRes();
    await ctrl.criar({ body: { nome: 'A', preco: -10 } }, res);

    expect(res.statusCode).toBe(422);
    expect(res.body.msg).toBe('Dados inválidos');
  });

  test('listar -> 200 JSON com filtros e sort válidos', async () => {
    setFindSortLean([{ nome: 'Mouse' }]);

    const req = {
      query: { q: 'mo', categoria: 'outros', ativo: 'true', sort: 'nome:asc', format: 'json' },
      accepts: () => 'json',
      path: '/api/v1/produtos',
    };
    const res = mockRes();

    await ctrl.listar(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].nome).toBe('Mouse');
  });

  test('atualizar (PUT) -> 200 quando ok', async () => {
    setFindOneLean(null); // não há duplicado
    Produto.findOneAndUpdate.mockResolvedValue({
      _id: 'id', nome: 'SSD NVMe', estoque: 5,
    });

    const req = {
      params: { id: 'id' },
      body: { nome: 'SSD NVMe', preco: 399.99, categoria: 'outros', estoque: 5, ativo: true },
    };
    const res = mockRes();

    await ctrl.atualizar(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.nome).toBe('SSD NVMe');
    expect(Produto.findOneAndUpdate).toHaveBeenCalled();
  });

  test('atualizar (PUT) -> 409 quando nome duplicado', async () => {
    setFindOneLean({ _id: 'outro' });

    const res = mockRes();
    await ctrl.atualizar({
      params: { id: 'id' },
      body: { nome: 'Duplicado', preco: 10, categoria: 'outros' },
    }, res);

    expect(res.statusCode).toBe(409);
  });

  test('atualizarParcial (PATCH) -> 200 quando ok', async () => {
    // sem mudar nome → não chama existeNomeDuplicado
    Produto.findOneAndUpdate.mockResolvedValue({ _id: 'id', estoque: 7 });

    const res = mockRes();
    await ctrl.atualizarParcial({
      params: { id: 'id' },
      body: { estoque: 7 },
    }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.estoque).toBe(7);
  });

  test('remover -> 409 quando estoque > 0', async () => {
    const res = mockRes();
    await ctrl.remover({ params: { id: 'x' }, produto: { estoque: 5 } }, res);

    expect(res.statusCode).toBe(409);
    expect(Produto.findByIdAndDelete).not.toHaveBeenCalled();
  });

  test('remover -> 204 quando estoque == 0', async () => {
    Produto.findByIdAndDelete.mockResolvedValue({});
    const res = mockRes();

    await ctrl.remover({ params: { id: 'x' }, produto: { estoque: 0 } }, res);

    expect(res.statusCode).toBe(204);
    expect(res.body).toBeNull();
    expect(Produto.findByIdAndDelete).toHaveBeenCalledWith('x');
  });
});

