import express from 'express';
import cors from 'cors';
import { fetchChartData, fetchPlanetaryPositions, fetchAscendant, fetchDashas } from './services/astrologyService.js';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for testing, update for production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API endpoints
app.post('/api/chart', async (req, res) => {
  try {
    const birthDetails = req.body;
    const chartData = await fetchChartData(birthDetails);
    res.json(chartData);
  } catch (error) {
    console.error('Error generating chart:', error);
    res.status(500).json({ error: 'Failed to generate chart', message: error.message });
  }
});

app.post('/api/planets', async (req, res) => {
  try {
    const birthDetails = req.body;
    const planets = await fetchPlanetaryPositions(birthDetails);
    res.json(planets);
  } catch (error) {
    console.error('Error fetching planets:', error);
    res.status(500).json({ error: 'Failed to fetch planetary positions', message: error.message });
  }
});

app.post('/api/ascendant', async (req, res) => {
  try {
    const birthDetails = req.body;
    const ascendant = await fetchAscendant(birthDetails);
    res.json(ascendant);
  } catch (error) {
    console.error('Error fetching ascendant:', error);
    res.status(500).json({ error: 'Failed to fetch ascendant', message: error.message });
  }
});

app.post('/api/dashas', async (req, res) => {
  try {
    const birthDetails = req.body;
    const dashas = await fetchDashas(birthDetails);
    res.json(dashas);
  } catch (error) {
    console.error('Error fetching dashas:', error);
    res.status(500).json({ error: 'Failed to fetch dashas', message: error.message });
  }
});

// Determine ephemeris path with priority for environment variable
const ephePath = process.env.EPHE_PATH || path.resolve(__dirname, '../ephe');
console.log(`Using ephemeris path: ${ephePath}`);

// Serve static ephemeris files
app.use('/ephe', express.static(ephePath));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Vedic Astrology API is running',
    environment: process.env.NODE_ENV,
    ephemerisPath: ephePath
  });
});

// Root route for service verification
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Vedic Astrology API',
    version: '1.0.0',
    endpoints: [
      { route: '/api/chart', method: 'POST', description: 'Generate full astrological chart' },
      { route: '/api/planets', method: 'POST', description: 'Get planetary positions' },
      { route: '/api/ascendant', method: 'POST', description: 'Get ascendant information' },
      { route: '/api/dashas', method: 'POST', description: 'Get dasha periods' },
      { route: '/health', method: 'GET', description: 'Health check endpoint' }
    ],
    documentation: 'For API usage instructions, see README.md'
  });
});

export default app;