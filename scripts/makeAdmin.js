const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Basic dotenv parser to read .env
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found at', envPath);
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.replace(/^"|"\s*$/g, '');
      }
      process.env[key] = value;
    }
  });
}

async function main() {
  loadEnv();

  const identifier = process.argv[2];
  if (!identifier) {
    console.log('Usage: node scripts/makeAdmin.js <email_or_phone>');
    console.log('Example: node scripts/makeAdmin.js +919999999999');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not set in your .env file');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');

    // Find the user by email or phone
    const user = await usersCollection.findOne({
      $or: [
        { email: identifier },
        { phone: identifier }
      ]
    });

    if (!user) {
      console.log(`User not found with email or phone: ${identifier}`);
      console.log(`Please sign in with this phone number on the homepage first, then run this script.`);
      return;
    }

    // Update user to admin
    await usersCollection.updateOne({ _id: user._id }, { $set: { isAdmin: true } });
    console.log(`Successfully set user ${identifier} (${user.name || 'No Name'}) as Admin!`);
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await client.close();
  }
}

main();
