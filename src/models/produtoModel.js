// Schema Produto - feature/model-produto
const mongoose = require('mongoose');

const CATEGORIAS = ['frutas', 'bebidas', 'higiene', 'outros'];

const produtoSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      minlength: [3, 'Nome deve ter no mínimo 3 caracteres'],
      maxlength: [60, 'Nome deve ter no máximo 60 caracteres'],
      trim: true
    },
    // usado para unicidade case-insensitive
    nomeLower: {
      type: String,
      unique: true,
      lowercase: true,
      select: false,
      index: true
    },
    preco: {
      type: Number,
      required: [true, 'Preço é obrigatório'],
      min: [0.01, 'Preço deve ser maior que 0'],
      max: [100000, 'Preço excede o limite permitido'],
      validate: {
        validator: (v) => Number.isFinite(v) && Number.isInteger(Math.round(v * 100)), // 2 casas decimais
        message: 'Preço deve ter no máximo 2 casas decimais'
      }
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true, // normaliza
      match: [/^[A-Z0-9-]{6,20}$/, 'SKU deve conter 6–20 caracteres (A-Z, 0-9, -)'],
      unique: true,
      sparse: true, // permite vários docs sem sku definido
      index: true
    },
    categoria: {
      type: String,
      enum: {
        values: CATEGORIAS,
        message: 'Categoria inválida'
      },
      default: 'outros'
    },
    estoque: {
      type: Number,
      min: [0, 'Estoque não pode ser negativo'],
      default: 0
    },
    ativo: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// manter nomeLower sincronizado
produtoSchema.pre('validate', function (next) {
  if (typeof this.nome === 'string') {
    this.nomeLower = this.nome.trim().toLowerCase();
  }
  next();
});

produtoSchema.set('toJSON', { versionKey: false });

module.exports = mongoose.model('Produto', produtoSchema);
module.exports.CATEGORIAS = CATEGORIAS;


