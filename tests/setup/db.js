const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;

async function connect() {
  mongo = await MongoMemoryServer.create({
    binary: { version: '7.0.12' } // opcional: força versão
  });
  const uri = mongo.getUri();
  process.env.MONGODB_USER = ''; // não usados na string direta
  process.env.MONGODB_PASWD = '';
  process.env.MONGODB_HOST = '';
  process.env.MONGODB_DBNAME = '';

  // Conecta direto com URI do memory server
  await mongoose.connect(uri, { dbName: 'api_produtos_test' });
}

async function closeDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
}

async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany();
  }
}

module.exports = {
  connect,
  closeDatabase,
  clearDatabase
};
