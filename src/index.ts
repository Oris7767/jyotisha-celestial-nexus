
import app from "./server.js";
import path from 'path';
import fs from 'fs';

// Set up environment variables
const PORT = process.env.PORT || 10000;
const ENV = process.env.NODE_ENV || 'development';
const EPHE_PATH = process.env.EPHE_PATH || './ephe';

console.log('Starting Vedic Astrology API Server...');
console.log(`Environment: ${ENV}`);
console.log(`Ephemeris path: ${EPHE_PATH}`);

// Try to load environment variables if dotenv is available
try {
  const dotenvPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(dotenvPath)) {
    console.log(`Found .env file at ${dotenvPath}`);
    
    // Dynamically import dotenv
    import('dotenv').then(dotenv => {
      dotenv.config({ path: dotenvPath });
      console.log('Environment variables loaded successfully from .env');
      startServer();
    }).catch(err => {
      console.warn(`Could not load dotenv module: ${err.message}`);
      console.log('Continuing without dotenv');
      startServer();
    });
  } else {
    console.log('No .env file found, using default or system environment variables');
    startServer();
  }
} catch (error) {
  console.warn(`Warning during environment setup: ${error instanceof Error ? error.message : 'Unknown error'}`);
  console.log('Continuing without dotenv');
  startServer();
}

function startServer() {
  // Start server
  app.listen(PORT, () => {
    console.log(`Vedic Astrology API Server is running on port ${PORT}`);
  });
}

export default app;
