
import express from 'express';
import cors from 'cors';
import { 
  fetchChartData, 
  fetchPlanetaryPositions, 
  fetchAscendant, 
  fetchDashas, 
  fetchHouses,
  fetchNakshatra
} from './services/astrologyService.js';
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
    console.log("Received request for chart:", birthDetails);
    const chartData = await fetchChartData(birthDetails);
    res.json(chartData);
  } catch (error: any) {
    console.error('Error generating chart:', error);
    res.status(500).json({ error: 'Failed to generate chart', message: error?.message || 'Unknown error' });
  }
});

app.post('/api/planets', async (req, res) => {
  try {
    const birthDetails = req.body;
    console.log("Received request for planets:", birthDetails);
    const planets = await fetchPlanetaryPositions(birthDetails);
    res.json(planets);
  } catch (error: any) {
    console.error('Error fetching planets:', error);
    res.status(500).json({ error: 'Failed to fetch planetary positions', message: error?.message || 'Unknown error' });
  }
});

app.post('/api/ascendant', async (req, res) => {
  try {
    const birthDetails = req.body;
    console.log("Received request for ascendant:", birthDetails);
    const ascendant = await fetchAscendant(birthDetails);
    res.json(ascendant);
  } catch (error: any) {
    console.error('Error fetching ascendant:', error);
    res.status(500).json({ error: 'Failed to fetch ascendant', message: error?.message || 'Unknown error' });
  }
});

app.post('/api/houses', async (req, res) => {
  try {
    const birthDetails = req.body;
    console.log("Received request for houses:", birthDetails);
    const houses = await fetchHouses(birthDetails);
    res.json(houses);
  } catch (error: any) {
    console.error('Error fetching houses:', error);
    res.status(500).json({ error: 'Failed to fetch houses', message: error?.message || 'Unknown error' });
  }
});

app.post('/api/dashas', async (req, res) => {
  try {
    const birthDetails = req.body;
    console.log("Received request for dashas:", birthDetails);
    const dashas = await fetchDashas(birthDetails);
    res.json(dashas);
  } catch (error: any) {
    console.error('Error fetching dashas:', error);
    res.status(500).json({ error: 'Failed to fetch dashas', message: error?.message || 'Unknown error' });
  }
});

app.post('/api/nakshatra', async (req, res) => {
  try {
    const birthDetails = req.body;
    const planet = req.query.planet as string;
    
    if (!planet) {
      return res.status(400).json({ error: 'Missing planet parameter in query' });
    }
    
    console.log(`Received request for nakshatra of ${planet}:`, birthDetails);
    const nakshatra = await fetchNakshatra(birthDetails, planet);
    res.json(nakshatra);
  } catch (error: any) {
    console.error('Error fetching nakshatra:', error);
    res.status(500).json({ error: 'Failed to fetch nakshatra', message: error?.message || 'Unknown error' });
  }
});

app.post('/api/fullchart', async (req, res) => {
  try {
    const birthDetails = req.body;
    console.log("Received request for full chart:", birthDetails);
    const chartData = await fetchChartData(birthDetails);
    res.json(chartData);
  } catch (error: any) {
    console.error('Error generating full chart:', error);
    res.status(500).json({ error: 'Failed to generate full chart', message: error?.message || 'Unknown error' });
  }
});

// Determine ephemeris path with priority for environment variable
const ephePath = process.env.EPHE_PATH || path.resolve(process.cwd(), 'ephe');
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
      { route: '/api/chart', method: 'POST', description: 'Generate basic astrological chart' },
      { route: '/api/fullchart', method: 'POST', description: 'Generate complete astrological chart' },
      { route: '/api/planets', method: 'POST', description: 'Get planetary positions' },
      { route: '/api/ascendant', method: 'POST', description: 'Get ascendant information' },
      { route: '/api/houses', method: 'POST', description: 'Get house cusps information' },
      { route: '/api/dashas', method: 'POST', description: 'Get dasha periods' },
      { route: '/api/nakshatra', method: 'POST', description: 'Get nakshatra for a specific planet (use ?planet=SUN)' },
      { route: '/health', method: 'GET', description: 'Health check endpoint' }
    ],
    documentation: 'For API usage instructions, see README.md'
  });
});

export default app;
