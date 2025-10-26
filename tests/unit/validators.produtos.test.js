const {
  validarCriar,
  validarPUT,
  validarPATCH,
} = require('../../src/validators/produtosValidator');

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = function (code) { this.statusCode = code; return this; };
  res.json = function (obj) { this.body = obj; return this; };
  return res;
}

function runMiddleware(mw, req) {
  return new Promise((resolve) => {
    const res = mockRes();
    mw(req, res, () => resolve({ next: true, res }))
    if (!res.body && res.statusCode !== 200) resolve({ next: false, res });
    setImmediate(() => resolve({ next: false, res }));
  });
}

describe('Validators de Produtos', () => {
  test('validarCriar - 422 quando falta campo obrigatório', async () => {
    const req = { body: { preco: 10 } }; // sem nome
    const result = await runMiddleware(validarCriar, req);
    expect(result.next).toBe(false);
    expect(result.res.statusCode).toBe(422);
  });

  test('validarCriar - permite criação válida', async () => {
    const req = { body: { nome: 'Produto ABC', preco: 12.5, categoria: 'outros' } };
    let nextCalled = false;
    await validarCriar(req, mockRes(), () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    // Sanitização: req.body permanece com valores coerentes
    expect(req.body.nome).toBe('Produto ABC');
    expect(typeof req.body.preco).toBe('number');
  });

  test('validarPUT - exige todos os campos principais', async () => {
    const req = { body: { nome: 'X' } }; // sem preco
    const result = await runMiddleware(validarPUT, req);
    expect(result.res.statusCode).toBe(422);
  });

  test('validarPATCH - exige ao menos um campo permitido', async () => {
    const req = { body: { qualquer: 'coisa' } };
    const result = await runMiddleware(validarPATCH, req);
    expect(result.res.statusCode).toBe(422);
  });

  test('validarPATCH - aceita parcial válido', async () => {
    const req = { body: { estoque: 3 } };
    let nextCalled = false;
    await validarPATCH(req, mockRes(), () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(req.body.estoque).toBe(3);
  });
});
