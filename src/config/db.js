const mongoose = require('mongoose');

const {
  MONGODB_USER,
  MONGODB_PASWD,
  MONGODB_HOST,
  MONGODB_DBNAME,
} = process.env;

const uri = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASWD}@${MONGODB_HOST}/${MONGODB_DBNAME}?retryWrites=true&w=majority`;

async function connectDB() {
  if (!MONGODB_USER || !MONGODB_PASWD || !MONGODB_HOST || !MONGODB_DBNAME) {
    throw new Error('Variáveis do banco ausentes no .env');
  }
  await mongoose.connect(uri);
  console.log('✅ Conectado ao MongoDB Atlas!');
}

module.exports = { connectDB };
