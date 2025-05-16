import app from './server.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 10000;

// Start server
app.listen(PORT, () => {
  console.log(`Vedic Astrology API Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Ephemeris path: ${process.env.EPHE_PATH || './ephe'}`);
});

export default app;