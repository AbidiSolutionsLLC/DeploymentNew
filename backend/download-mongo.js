const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  try {
    console.log('Starting MongoMemoryServer...');
    const mongod = await MongoMemoryServer.create();
    console.log('Started successfully on URI:', mongod.getUri());
    await mongod.stop();
    console.log('Stopped successfully.');
  } catch (error) {
    console.error('Failed to start MongoMemoryServer:', error);
  }
})();
