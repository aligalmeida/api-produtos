// src/docs/openapi.js
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'API Produtos',
      version: '1.0.0',
      description: 'API RESTful para gestão de produtos (v1)',
    },
    servers: [
      { url: '/api/v1', description: 'API v1' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Envie o token no header: Authorization: Bearer <token>',
        },
      },
      schemas: {
        Produto: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6701f5a0ab12cd34ef567890' },
            nome: { type: 'string', example: 'Sabonete' },
            preco: { type: 'number', example: 12.5 },
            sku: { type: 'string', example: 'SAB-001' },
            categoria: { type: 'string', example: 'higiene' },
            estoque: { type: 'integer', example: 10 },
            ativo: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'NotFound' },
            message: { type: 'string', example: 'Rota não encontrada' },
          },
        },
      },
    },
  },
  // Gera paths a partir dos comentários JSDoc nas rotas
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = { swaggerSpec };

