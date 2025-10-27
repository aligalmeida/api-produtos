# API-PRODUTOS

API RESTful para gestão de produtos com **Node.js**, **Express**, **MongoDB/Mongoose** e **JWT**.  
Inclui **documentação Swagger (OpenAPI)**, **página HTML semântica** para listagem de produtos (content negotiation), **healthcheck** com métricas e **testes unitários e de integração** usando **Jest**, **Supertest** e **mongodb-memory-server**.

> **Autoria**  
> **Aline Gonçalves de Almeida**  
> Matrícula: **2324291025**  
> 🧩 Divisão de tarefas: realizei **100%** do projeto (planejamento, modelagem, implementação, testes e documentação).

---

## Sumário

- [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Pré-requisitos](#pré-requisitos)
- [Configuração (arquivo .env)](#configuração-arquivo-env)
- [Instalação e Execução](#instalação-e-execução)
- [Documentação Swagger](#documentação-swagger)
- [Healthcheck](#healthcheck)
- [Content Negotiation (HTML/JSON)](#content-negotiation-htmljson)
- [Rotas e Exemplos](#rotas-e-exemplos)
- [Scripts NPM](#scripts-npm)
- [Testes (unit e integração)](#testes-unit-e-integração)
- [Seed de Dados](#seed-de-dados)
- [Boas Práticas e Regras de Negócio](#boas-práticas-e-regras-de-negócio)
- [Solução de Problemas](#solução-de-problemas)
- [Licença](#licença)

---

## Arquitetura e Tecnologias

- **Node.js / Express**: servidor HTTP e roteamento.
- **MongoDB / Mongoose**: persistência, schema e validações.
- **JWT (jsonwebtoken)**: autenticação via Bearer Token.
- **Swagger (swagger-ui-express + OpenAPI YAML)**: documentação.
- **Jest, Supertest, mongodb-memory-server**: testes com banco em memória.
- **dotenv**: variáveis de ambiente.
- **HTML semântico**: listagem de produtos e tela de health (content negotiation).

---

## Estrutura de Pastas

```
API-PRODUTOS/
├── src/
│   ├── config/           # conexão Mongo (db.js)
│   ├── controllers/      # regras de negócio (produtosController.js)
│   ├── docs/             # OpenAPI (openapi.yaml) e geração via JSDoc (openapi.js)
│   ├── middleware/       # auth (JWT)
│   ├── models/           # Mongoose schema (produtoModel.js)
│   ├── routes/           # rotas /auth e /produtos
│   ├── scripts/          # seed de produtos
│   ├── utils/            # healthcheck (HTML/JSON)
│   ├── validators/       # validações de entrada (produtosValidator.js)
│   └── server.js         # app Express
├── tests/                # unit e integração
├── .env                  # variáveis (exemplo abaixo)
├── jest.config.js
├── package.json
└── ...
```

---

## Pré-requisitos

- **Node.js 18+** (recomendado 18 LTS ou 20 LTS)
- **npm 9+**
- **MongoDB Atlas** (ou um Mongo local) — para execução normal.  
  > Em **testes**, o projeto usa **mongodb-memory-server** (não requer instância externa).

---

## Configuração (arquivo `.env`)

Crie um `.env` na raiz (já existe um exemplo no repositório). Campos:

```env
PORT=3000

# MongoDB Atlas
MONGODB_USER=seuUsuario
MONGODB_PASWD=suaSenha
MONGODB_HOST=cluster0.abc123.mongodb.net
MONGODB_DBNAME=api_produtos

# Auth
JWT_SECRET=sua_chave_secreta_grande_e_aleatoria
AUTH_USERNAME=admin
AUTH_PASSWORD=admin123
```

> Em **ambiente de teste**, essas variáveis de Mongo são ignoradas — o Jest conecta num banco **em memória**.

---

## Instalação e Execução

```bash
# 1) Instalar dependências
npm install

# 2) Subir em modo desenvolvimento
npm run dev

# 3) Ou subir em modo produção/local
npm start
```

- API base: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/docs`
- Health: `http://localhost:3000/health` (HTML no navegador) e `http://localhost:3000/health.json` (JSON)

---

## Documentação Swagger

- Arquivo fonte: `src/docs/openapi.yaml`
- Servida em: `http://localhost:3000/docs`

> Caso o YAML não seja encontrado ou haja erro de leitura, a aplicação **continua rodando** e exibe um fallback explicando como corrigir.

---

## Healthcheck

- `GET /health` → negocia conteúdo:
  - Navegador → HTML bonito com métricas
  - Clients/CLI → JSON
- `GET /health.json` → força JSON
- Exibe:
  - Status (`ok`, `degraded`)
  - Versão, Node.js, uptime, memória
  - Mongo (latência, db, coleções, contagem `produtos`)

---

## Content Negotiation (HTML/JSON)

- `GET /api/v1/produtos`:
  - Navegador → HTML semântico (tabela + filtros)
  - Clients/CLI → JSON
  - Forçar JSON: `/api/v1/produtos.json` **ou** `?format=json`

---

## Rotas e Exemplos

### 1) Autenticação

**Login**  
`POST /api/v1/auth/login`

```bash
curl -X POST http://localhost:3000/api/v1/auth/login   -H "Content-Type: application/json"   -d '{"username":"admin","password":"admin123"}'
```

Resposta `200 OK`:
```json
{ "token": "<JWT>" }
```

> Use o token nas rotas protegidas com:  
> `Authorization: Bearer <JWT>`

---

### 2) Produtos

**Listar (HTML ou JSON)**
```
GET /api/v1/produtos
GET /api/v1/produtos.json
```

**Filtros & Ordenação**  
- `q` (busca em `nome`/`sku`)  
- `categoria` (`frutas|bebidas|higiene|outros`)  
- `ativo` (`true|false`)  
- `sort` (`campo:dir`) — campos: `nome|preco|estoque|createdAt|updatedAt` / dir: `asc|desc`

Exemplo:
```bash
curl "http://localhost:3000/api/v1/produtos.json?q=note&categoria=outros&ativo=true&sort=preco:desc"
```

**Criar (protegida + validação)**
```
POST /api/v1/produtos
```
```bash
curl -X POST http://localhost:3000/api/v1/produtos   -H "Authorization: Bearer <JWT>"   -H "Content-Type: application/json"   -d '{"nome":"Teclado","preco":199.90,"categoria":"outros","estoque":10,"ativo":true}'
```
- Resposta: `201 Created` + Header `Location: /api/v1/produtos/<id>`

**Obter por ID**
```
GET /api/v1/produtos/:id
```

**Atualizar (PUT — total, protegida + validação)**
```
PUT /api/v1/produtos/:id
```
```bash
curl -X PUT http://localhost:3000/api/v1/produtos/<id>   -H "Authorization: Bearer <JWT)"   -H "Content-Type: application/json"   -d '{"nome":"SSD NVMe","preco":399.99,"categoria":"outros","estoque":5,"ativo":true}'
```

**Atualizar parcialmente (PATCH — protegida + validação)**
```
PATCH /api/v1/produtos/:id
```
```bash
curl -X PATCH http://localhost:3000/api/v1/produtos/<id>   -H "Authorization: Bearer <JWT>"   -H "Content-Type: application/json"   -d '{"estoque":7}'
```

**Remover (protegida + regra de negócio)**
```
DELETE /api/v1/produtos/:id
```
- **Regra**: só permite remover se `estoque === 0`.  
  - Se `estoque > 0` → `409 Conflict`.

---

## Scripts NPM

```json
"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "test": "cross-env NODE_ENV=test jest --runInBand",
  "test:watch": "cross-env NODE_ENV=test jest --watch",
  "test:coverage": "cross-env NODE_ENV=test jest --coverage"
}
```

---

## Testes (unit e integração)

- **Ambiente**: `NODE_ENV=test`
- **Banco**: **mongodb-memory-server** (não precisa de Mongo externo).
- **Rodar**:
  ```bash
  npm test
  # ou com cobertura
  npm run test:coverage
  ```
- **Estrutura de testes**:
  - `tests/unit/validators.produtos.test.js`
  - `tests/integration/auth.routes.test.js`
  - `tests/integration/produtos.routes.test.js`
  - `tests/setup/db.js` (config memória)
  - `tests/utils/testApp.js` (helper de login, supertest)

---

## Seed de Dados

Script opcional para popular com uma lista maior:

```bash
node src/scripts/seedProdutos.js
```

> Requer conexão com Mongo válida (usa `connectDB()` do projeto).

---

## Boas Práticas e Regras de Negócio

- **Unicidade de `nome`** (case-insensitive) via campo auxiliar `nomeLower`.
- **SKU**: opcional, mas se presente, segue regex `^[A-Z0-9-]{6,20}$` e é **único**.
- **Categoria**: `frutas`, `bebidas`, `higiene`, `outros`.
- **Preço**: `> 0`, até 2 casas decimais (validação no Model e Validator).
- **DELETE**: bloqueado se `estoque > 0` (retorna `409`).
- **Content negotiation** em `/produtos` e `/health`.

---

## Solução de Problemas

- **Swagger não abre** em `/docs`
  - Verifique `src/docs/openapi.yaml`. Se ausente ou com erro, um fallback é exibido.  
  - Corrija o YAML e recarregue a página.

- **Variáveis de ambiente ausentes**
  - A conexão com o Mongo exige `MONGODB_USER/PASWD/HOST/DBNAME`.  
  - Em **testes**, isso não é necessário (usa banco em memória).

- **Erro de validação de preço**
  - O backend aceita no máximo **2 casas decimais**.  
  - Envie valores formatados (ex.: `199.90`, não `199.999`).

- **DELETE retorna 409**
  - A regra de negócio impede remover com `estoque > 0`. Faça PATCH/PUT para `estoque: 0` e tente novamente.

---

## Licença

Projeto acadêmico desenvolvido por **Aline Gonçalves de Almeida** (Matrícula **2324291025**).  
Uso educacional; cite a autora se reutilizar.
