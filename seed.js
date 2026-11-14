// Loads the destinations into MongoDB (database "myDB", collection "destinations").
// Usage: npm run seed   (set MONGO_URI to use a server other than localhost)
const { MongoClient } = require('mongodb');
const destinations = require('./database/destinations.json');

(async () => {
  const client = new MongoClient(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017');
  await client.connect();
  const collection = client.db(process.env.DB_NAME || 'myDB').collection('destinations');
  for (const { _id, ...destination } of destinations) {
    await collection.updateOne({ name: destination.name }, { $set: destination }, { upsert: true });
  }
  console.log(`Seeded ${destinations.length} destinations`);
  await client.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
