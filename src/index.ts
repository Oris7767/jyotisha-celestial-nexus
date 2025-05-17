
import app from "./server.js";
import path from 'path';
import fs from 'fs';

// Cố gắng tải dotenv một cách an toàn
try {
  const dotenvPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(dotenvPath)) {
    console.log(`Found .env file at ${dotenvPath}`);
    
    // Động thử import dotenv
    import('dotenv').then(dotenv => {
      dotenv.config({ path: dotenvPath });
      console.log('Environment variables loaded successfully');
    }).catch(err => {
      console.warn(`Warning: Could not load dotenv module: ${err.message}`);
      console.log('Continuing without dotenv');
    });
  } else {
    console.log('No .env file found, using default or system environment variables');
  }
} catch (error) {
  console.warn(`Warning during environment setup: ${error instanceof Error ? error.message : 'Unknown error'}`);
  console.log('Continuing without dotenv');
}

// Fallback for environment variables
const PORT = process.env.PORT || 10000;
const ENV = process.env.NODE_ENV || 'development';
const EPHE_PATH = process.env.EPHE_PATH || './ephe';

// Start server
app.listen(PORT, () => {
  console.log(`Vedic Astrology API Server is running on port ${PORT}`);
  console.log(`Environment: ${ENV}`);
  console.log(`Ephemeris path: ${EPHE_PATH}`);
});

export default app;
