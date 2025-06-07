require('dotenv').config();
const mongoose = require('mongoose');

async function clearDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      console.log(`Dropping collection: ${collection.name}`);
      await mongoose.connection.db.dropCollection(collection.name);
    }
    
    console.log('\nAll collections dropped successfully!');
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

clearDatabase();
