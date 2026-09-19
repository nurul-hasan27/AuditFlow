import mongoose from 'mongoose';
import { config } from './env.js';

let mongod: any = null;

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  let uri = config.mongoUri;

  if (process.env.NODE_ENV === 'test' || uri === 'memory' || !uri) {
    try {
      console.log('🔄 Initializing in-memory MongoDB instance for local development/testing...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('✅ In-memory MongoDB started at:', uri);
    } catch (err) {
      console.error('Failed to start MongoMemoryServer:', err);
      throw err;
    }
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host || 'local-in-memory'}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}
