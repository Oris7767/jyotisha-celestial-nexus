
import express from 'express';
import cors from 'cors';
import { fetchChartData, fetchPlanetaryPositions, fetchAscendant, fetchDashas } from './services/astrologyService';
import { BirthDetails } from './types/astrology';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API endpoints
app.post('/api/chart', async (req, res) => {
  try {
    const birthDetails = req.body as BirthDetails;
    const chartData = await fetchChartData(birthDetails);
    res.json(chartData);
  } catch (error) {
    console.error('Error generating chart:', error);
    res.status(500).json({ error: 'Failed to generate chart', message: error.message });
  }
});

app.post('/api/planets', async (req, res) => {
  try {
    const birthDetails = req.body as BirthDetails;
    const planets = await fetchPlanetaryPositions(birthDetails);
    res.json(planets);
  } catch (error) {
    console.error('Error fetching planets:', error);
    res.status(500).json({ error: 'Failed to fetch planetary positions', message: error.message });
  }
});

app.post('/api/ascendant', async (req, res) => {
  try {
    const birthDetails = req.body as BirthDetails;
    const ascendant = await fetchAscendant(birthDetails);
    res.json(ascendant);
  } catch (error) {
    console.error('Error fetching ascendant:', error);
    res.status(500).json({ error: 'Failed to fetch ascendant', message: error.message });
  }
});

app.post('/api/dashas', async (req, res) => {
  try {
    const birthDetails = req.body as BirthDetails;
    const dashas = await fetchDashas(birthDetails);
    res.json(dashas);
  } catch (error) {
    console.error('Error fetching dashas:', error);
    res.status(500).json({ error: 'Failed to fetch dashas', message: error.message });
  }
});

// Serve static ephemeris files - ensure absolute path
app.use('/ephe', express.static(path.resolve(__dirname, '../ephe')));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Vedic Astrology API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Ephemeris path: ${process.env.EPHE_PATH || path.resolve(__dirname, '../ephe')}`);
});

export default app;
