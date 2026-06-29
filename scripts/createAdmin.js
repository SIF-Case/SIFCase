const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Basic dotenv parser
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) { console.error('Error: .env not found'); process.exit(1); }
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = (match[2] || '').trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  });
}

async function main() {
  loadEnv();

  const phone = process.argv[2];
  if (!phone) {
    console.log('Usage: node scripts/createAdmin.js <phone_with_country_code>');
    console.log('Example: node scripts/createAdmin.js +919876543210');
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) { console.error('Error: MONGODB_URI not set'); process.exit(1); }

  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const users = db.collection('users');

    const existing = await users.findOne({ phone });

    if (existing) {
      // User already exists — just promote to admin
      await users.updateOne({ _id: existing._id }, { $set: { isAdmin: true } });
      console.log(`✅ Existing user ${phone} promoted to admin!`);
    } else {
      // Create brand-new admin user with this phone number
      const now = new Date();
      await users.insertOne({
        phone,
        name: 'Admin',
        isAdmin: true,
        isBlocked: false,
        role: null,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`✅ Admin user created for ${phone}!`);
    }

    console.log('\nNext steps:');
    console.log('1. Enable Phone Auth in Firebase Console (Authentication > Sign-in method > Phone)');
    console.log(`2. Add ${phone} as a test number with OTP: 123456`);
    console.log('3. Log in on the website using that phone number and OTP 123456');
    console.log('4. Go to http://localhost:3000/admin');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
}

main();
