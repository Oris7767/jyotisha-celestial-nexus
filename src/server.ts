import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import moment from 'moment-timezone';
import { 
  fetchChartData, 
  fetchPlanetaryPositions, 
  fetchAscendant, 
  fetchDashas, 
  fetchHouses,
  fetchNakshatra
} from './services/astrologyService.js';
import { BirthDetails, ErrorResponse } from './types/astrology.js';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for testing, update for production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure JSON body parser with more robust error handling
app.use(express.json({ 
  limit: '1mb',
  reviver: (key, value) => {
    // Special handling for numeric values
    if (key === 'latitude' || key === 'longitude') {
      return typeof value === 'string' ? parseFloat(value) : value;
    }
    return value;
  }
}));

// Middleware to validate timezone
const validateTimezone = (req: Request, res: Response<ErrorResponse>, next: NextFunction) => {
  const { timezone } = req.body;
  
  if (!timezone) {
    return res.status(400).json({
      error: 'Missing timezone',
      message: 'Timezone is required'
    });
  }

  if (!moment.tz.zone(timezone)) {
    return res.status(400).json({
      error: 'Invalid timezone',
      message: `Invalid timezone: ${timezone}. Please use IANA timezone names (e.g., 'Asia/Ho_Chi_Minh')`
    });
  }

  next();
};

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' && req.path.startsWith('/api/')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Request Body:', req.body);
  }
  next();
});

// API endpoints
app.post('/api/chart', validateTimezone, async (req: Request, res: Response) => {
  try {
    const birthDetails = req.body as BirthDetails;
    
    // Validate required fields
    if (!birthDetails || !birthDetails.date || !birthDetails.time || 
        birthDetails.latitude === undefined || birthDetails.longitude === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'Required fields: date, time, latitude, longitude' 
      } as ErrorResponse);
    }
    
    console.log("Received request for chart:", birthDetails);
    const chartData = await fetchChartData(birthDetails);
    res.json(chartData);
  } catch (error: any) {
    console.error('Error generating chart:', error);
    res.status(500).json({ 
      error: 'Failed to generate chart', 
      message: error?.message || 'Unknown error' 
    } as ErrorResponse);
  }
});

app.post('/api/planets', validateTimezone, async (req: Request, res: Response) => {
  try {
    const birthDetails = req.body as BirthDetails;
    
    // Validate required fields
    if (!birthDetails || !birthDetails.date || !birthDetails.time || 
        birthDetails.latitude === undefined || birthDetails.longitude === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'Required fields: date, time, latitude, longitude' 
      } as ErrorResponse);
    }
    
    console.log("Received request for planets:", birthDetails);
    const planets = await fetchPlanetaryPositions(birthDetails);
    res.json(planets);
  } catch (error: any) {
    console.error('Error fetching planets:', error);
    res.status(500).json({ 
      error: 'Failed to fetch planetary positions', 
      message: error?.message || 'Unknown error' 
    } as ErrorResponse);
  }
});

app.post('/api/ascendant', validateTimezone, async (req: Request, res: Response) => {
  try {
    const birthDetails = req.body as BirthDetails;
    
    // Validate required fields
    if (!birthDetails || !birthDetails.date || !birthDetails.time || 
        birthDetails.latitude === undefined || birthDetails.longitude === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'Required fields: date, time, latitude, longitude' 
      } as ErrorResponse);
    }
    
    console.log("Received request for ascendant:", birthDetails);
    const ascendant = await fetchAscendant(birthDetails);
    res.json(ascendant);
  } catch (error: any) {
    console.error('Error fetching ascendant:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ascendant', 
      message: error?.message || 'Unknown error' 
    } as ErrorResponse);
  }
});

app.post('/api/houses', validateTimezone, async (req: Request, res: Response) => {
  try {
    const birthDetails = req.body as BirthDetails;
    
    // Validate required fields
    if (!birthDetails || !birthDetails.date || !birthDetails.time || 
        birthDetails.latitude === undefined || birthDetails.longitude === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'Required fields: date, time, latitude, longitude' 
      } as ErrorResponse);
    }
    
    console.log("Received request for houses:", birthDetails);
    const houses = await fetchHouses(birthDetails);
    res.json(houses);
  } catch (error: any) {
    console.error('Error fetching houses:', error);
    res.status(500).json({ 
      error: 'Failed to fetch houses', 
      message: error?.message || 'Unknown error' 
    } as ErrorResponse);
  }
});

app.post('/api/dashas', validateTimezone, async (req: Request, res: Response) => {
  try {
    const birthDetails = req.body as BirthDetails;
    
    // Validate required fields
    if (!birthDetails || !birthDetails.date || !birthDetails.time || 
        birthDetails.latitude === undefined || birthDetails.longitude === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'Required fields: date, time, latitude, longitude' 
      } as ErrorResponse);
    }
    
    console.log("Received request for dashas:", birthDetails);
    const dashas = await fetchDashas(birthDetails);
    res.json(dashas);
  } catch (error: any) {
    console.error('Error fetching dashas:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashas', 
      message: error?.message || 'Unknown error' 
    } as ErrorResponse);
  }
});

app.post('/api/nakshatra', validateTimezone, async (req: Request, res: Response) => {
  try {
    const birthDetails = req.body as BirthDetails;
    const planet = req.query.planet as string;
    
    // Validate required fields
    if (!birthDetails || !birthDetails.date || !birthDetails.time || 
        birthDetails.latitude === undefined || birthDetails.longitude === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'Required fields: date, time, latitude, longitude' 
      } as ErrorResponse);
    }
    
    if (!planet) {
      return res.status(400).json({ 
        error: 'Missing planet parameter', 
        message: 'Required query parameter: planet' 
      } as ErrorResponse);
    }
    
    console.log(`Received request for nakshatra of ${planet}:`, birthDetails);
    const nakshatra = await fetchNakshatra(birthDetails, planet);
    res.json(nakshatra);
  } catch (error: any) {
    console.error('Error fetching nakshatra:', error);
    res.status(500).json({ 
      error: 'Failed to fetch nakshatra', 
      message: error?.message || 'Unknown error' 
    } as ErrorResponse);
  }
});

app.post('/api/fullchart', validateTimezone, async (req: Request, res: Response) => {
  try {
    const birthDetails = req.body as BirthDetails;
    
    // Validate required fields
    if (!birthDetails || !birthDetails.date || !birthDetails.time || 
        birthDetails.latitude === undefined || birthDetails.longitude === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'Required fields: date, time, latitude, longitude' 
      } as ErrorResponse);
    }
    
    console.log("Received request for full chart:", birthDetails);
    const chartData = await fetchChartData(birthDetails);
    res.json(chartData);
  } catch (error: any) {
    console.error('Error generating full chart:', error);
    res.status(500).json({ 
      error: 'Failed to generate full chart', 
      message: error?.message || 'Unknown error' 
    } as ErrorResponse);
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
    ephemerisPath: ephePath,
    version: '1.1.0',
    timezones: {
      supported: true,
      sample: moment.tz.names().slice(0, 5)
    }
  });
});

// Root route for service verification
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Vedic Astrology API',
    version: '1.1.0',
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

// Custom error handler for JSON parsing errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    return res.status(400).json({ 
      error: 'Invalid JSON', 
      message: 'The request body is not valid JSON. Please check your request format.',
      details: err.message
    });
  }
  next(err);
});

export default app;
