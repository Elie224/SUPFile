/**
 * MongoDB initialization script
 * Creates collections with indexes for SUPFile
 * Run this after MongoDB is running: node scripts/init-db.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');

const mongoUri = config.database.mongoUri || process.env.MONGO_URI;

if (!mongoUri) {
  console.error('❌ MONGO_URI not set in environment.');
  process.exit(1);
}

mongoose.set('strictQuery', false);

async function initDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Create collections with validators and indexes
    const collections = [
      {
        name: 'users',
        indexes: [
          { key: { email: 1 }, unique: true },
          { key: { oauth_provider: 1, oauth_id: 1 }, unique: true, sparse: true },
          { key: { is_active: 1 } },
          { key: { created_at: 1 } },
        ],
      },
      {
        name: 'sessions',
        indexes: [
          { key: { user_id: 1 } },
          { key: { refresh_token: 1 }, unique: true },
          { key: { expires_at: 1 }, expireAfterSeconds: 0 }, // TTL index
          { key: { is_revoked: 1 } },
        ],
      },
      {
        name: 'folders',
        indexes: [
          { key: { owner_id: 1 } },
          { key: { parent_id: 1 } },
          { key: { owner_id: 1, parent_id: 1 } },
          { key: { created_at: 1 } },
        ],
      },
      {
        name: 'files',
        indexes: [
          { key: { folder_id: 1 } },
          { key: { owner_id: 1 } },
          { key: { file_path: 1 }, unique: true },
          { key: { is_deleted: 1 } },
          { key: { created_at: 1 } },
        ],
      },
      {
        name: 'shares',
        indexes: [
          { key: { public_token: 1 }, unique: true, sparse: true },
          { key: { file_id: 1 } },
          { key: { folder_id: 1 } },
          { key: { created_by_id: 1 } },
          { key: { shared_with_user_id: 1 } },
          { key: { expires_at: 1 } },
          { key: { is_active: 1 } },
        ],
      },
      {
        name: 'audit_logs',
        indexes: [
          { key: { user_id: 1 } },
          { key: { action: 1 } },
          { key: { created_at: 1 } },
          { key: { resource_type: 1, resource_id: 1 } },
        ],
      },
    ];

    for (const col of collections) {
      try {
        const exists = await db.listCollections({ name: col.name }).toArray();
        if (exists.length === 0) {
          await db.createCollection(col.name);
          console.log(`✓ Created collection: ${col.name}`);
        } else {
          console.log(`✓ Collection ${col.name} already exists`);
        }

        const collection = db.collection(col.name);
        for (const idx of col.indexes) {
          const keyObj = idx.key;
          const options = { ...idx };
          delete options.key;
          try {
            await collection.createIndex(keyObj, options);
            console.log(`  ✓ Index on ${col.name}: ${JSON.stringify(keyObj)}`);
          } catch (e) {
            if (e.code === 85) {
              // Index already exists with different options
              console.log(`  ℹ Index already exists on ${col.name}: ${JSON.stringify(keyObj)}`);
            } else {
              console.warn(`  ✗ Failed to create index on ${col.name}:`, e.message);
            }
          }
        }
      } catch (e) {
        console.error(`✗ Error setting up collection ${col.name}:`, e.message);
      }
    }

    console.log('\n✓ Database initialization complete!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Database initialization failed:', err.message || err);
    process.exit(1);
  }
}

initDatabase();
