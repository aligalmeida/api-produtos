const mongoose = require('mongoose');

const produtoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, minlength: 3, trim: true },
    preco: { type: Number, required: true, min: 0.01 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Produto', produtoSchema);
