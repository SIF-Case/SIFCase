require('dotenv').config({ path: '/Users/roshanajith/Documents/Products/allsif/.env' });
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const nfos = await mongoose.connection.collection('nfos').find({}).toArray();
  console.log("All NFOs:");
  for (const nfo of nfos) {
    console.log(`- Title: ${nfo.title}, published: ${nfo.published}, closeDate: ${nfo.closeDate}`);
  }
  process.exit(0);
}
check();
