// src/scripts/seedProdutos.js
require('dotenv').config();
const mongoose = require('mongoose');
const Produto = require('../models/produtoModel');
const { connectDB } = require('../config/db');

(async () => {
  try {
    await connectDB();

    // Lista maior de produtos
    const produtos = [
      // --- Frutas ---
      { nome: 'Maçã Fuji', preco: 3.99, sku: 'FRUTA-001', categoria: 'frutas', estoque: 100, ativo: true },
      { nome: 'Banana Prata', preco: 2.49, sku: 'FRUTA-002', categoria: 'frutas', estoque: 120, ativo: true },
      { nome: 'Abacaxi Pérola', preco: 5.50, sku: 'FRUTA-003', categoria: 'frutas', estoque: 50, ativo: true },
      { nome: 'Manga Palmer', preco: 4.29, sku: 'FRUTA-004', categoria: 'frutas', estoque: 60, ativo: true },
      { nome: 'Uva Thompson', preco: 9.90, sku: 'FRUTA-005', categoria: 'frutas', estoque: 80, ativo: true },
      { nome: 'Melancia Inteira', preco: 25.00, sku: 'FRUTA-006', categoria: 'frutas', estoque: 30, ativo: true },

      // --- Bebidas ---
      { nome: 'Coca-Cola 2L', preco: 8.50, sku: 'BEBIDA-001', categoria: 'bebidas', estoque: 40, ativo: true },
      { nome: 'Suco de Laranja Natural', preco: 6.75, sku: 'BEBIDA-002', categoria: 'bebidas', estoque: 25, ativo: true },
      { nome: 'Água Mineral 500ml', preco: 2.20, sku: 'BEBIDA-003', categoria: 'bebidas', estoque: 200, ativo: true },
      { nome: 'Cerveja Heineken Long Neck', preco: 7.99, sku: 'BEBIDA-004', categoria: 'bebidas', estoque: 100, ativo: true },
      { nome: 'Vinho Tinto Suave', preco: 35.90, sku: 'BEBIDA-005', categoria: 'bebidas', estoque: 20, ativo: true },
      { nome: 'Energético Red Bull', preco: 9.50, sku: 'BEBIDA-006', categoria: 'bebidas', estoque: 50, ativo: true },

      // --- Higiene ---
      { nome: 'Sabonete Dove', preco: 4.99, sku: 'HIG-001', categoria: 'higiene', estoque: 100, ativo: true },
      { nome: 'Shampoo Pantene 400ml', preco: 19.90, sku: 'HIG-002', categoria: 'higiene', estoque: 80, ativo: true },
      { nome: 'Condicionador Pantene 400ml', preco: 19.90, sku: 'HIG-003', categoria: 'higiene', estoque: 75, ativo: true },
      { nome: 'Creme Dental Colgate Total 90g', preco: 8.99, sku: 'HIG-004', categoria: 'higiene', estoque: 150, ativo: true },
      { nome: 'Desodorante Rexona Aerosol', preco: 14.50, sku: 'HIG-005', categoria: 'higiene', estoque: 90, ativo: true },
      { nome: 'Papel Higiênico Neve 12 rolos', preco: 25.00, sku: 'HIG-006', categoria: 'higiene', estoque: 40, ativo: true },

      // --- Outros ---
      { nome: 'Notebook Dell Inspiron', preco: 4500.00, sku: 'OUTRO-001', categoria: 'outros', estoque: 10, ativo: true },
      { nome: 'Mouse Gamer Logitech G203', preco: 189.00, sku: 'OUTRO-002', categoria: 'outros', estoque: 50, ativo: true },
      { nome: 'Teclado Mecânico Redragon', preco: 299.90, sku: 'OUTRO-003', categoria: 'outros', estoque: 30, ativo: true },
      { nome: 'Monitor Samsung 24"', preco: 899.90, sku: 'OUTRO-004', categoria: 'outros', estoque: 25, ativo: true },
      { nome: 'Cadeira Ergonômica Office', preco: 1250.00, sku: 'OUTRO-005', categoria: 'outros', estoque: 15, ativo: true },
      { nome: 'Headset HyperX Cloud Stinger', preco: 379.00, sku: 'OUTRO-006', categoria: 'outros', estoque: 20, ativo: true },
      { nome: 'Câmera Web Logitech C270', preco: 229.00, sku: 'OUTRO-007', categoria: 'outros', estoque: 18, ativo: true },
      { nome: 'Cabo HDMI 2m', preco: 24.99, sku: 'OUTRO-008', categoria: 'outros', estoque: 100, ativo: true },
      { nome: 'Suporte para Monitor', preco: 139.90, sku: 'OUTRO-009', categoria: 'outros', estoque: 25, ativo: true },
      { nome: 'Pendrive SanDisk 64GB', preco: 59.90, sku: 'OUTRO-010', categoria: 'outros', estoque: 60, ativo: true }
    ];

    await Produto.deleteMany({});
    await Produto.insertMany(produtos);

    console.log('✅ Lista de produtos inserida com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao inserir produtos:', err);
    process.exit(1);
  }
})();
