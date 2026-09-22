import './config/env.js';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => console.log(`API listening on ${PORT}`));

    const gracefulShutdown = (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        try {
          if (typeof disconnectDB === 'function') {
            await disconnectDB();
          } else {
            await mongoose.connection.close(false);
          }
          console.log('MongoDB connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error during MongoDB disconnect:', err);
          process.exit(1);
        }
      });

      // Force shutdown after 10s if connections don't close
      setTimeout(() => {
        console.error('Forced shutdown after 10s timeout.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  })
  .catch((e) => {
    console.error('Failed to start server:', e);
    process.exit(1);
  });
