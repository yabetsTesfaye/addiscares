require('dotenv').config();
const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    console.log('----------------------');
    
    for (const collection of collections) {
      console.log(`\nCollection: ${collection.name}`);
      console.log('----------------------');
      
      // Get count of documents in the collection
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`Total documents: ${count}`);
      
      // Show a few sample documents
      if (count > 0) {
        const sample = await mongoose.connection.db.collection(collection.name).find({}).limit(2).toArray();
        console.log('Sample documents:');
        console.log(JSON.stringify(sample, null, 2));
      }
    }
    
    await mongoose.connection.close();
    console.log('\nConnection closed');
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase();
