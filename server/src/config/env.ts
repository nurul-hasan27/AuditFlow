import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5001,
  mongoUri: process.env.MONGODB_URI || 'memory',
  jwtSecret: process.env.JWT_SECRET || 'auditflow_dev_jwt_secret_super_secure_key_2026',
  jwtExpiresIn: '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
};
