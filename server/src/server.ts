import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';
import { User } from './models/User.js';
import { seedDatabase } from './config/seed.js';

async function bootstrap() {
  try {
    await connectDB();

    // Check if database needs seeding (e.g. fresh memory or empty db)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('ℹ️  No users found in database. Running initial seed...');
      await seedDatabase();
    }

    const app = createApp();

    app.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`🚀 AuditFlow API running on http://localhost:${config.port}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
      console.log(`🏢 Multi-tenancy enabled: ABC & Co. & XYZ & Co.`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('💥 Failed to bootstrap AuditFlow server:', error);
    process.exit(1);
  }
}

bootstrap();
