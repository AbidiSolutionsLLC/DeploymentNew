const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Increase timeout to 10 minutes to allow MongoDB binary download
jest.setTimeout(600000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
