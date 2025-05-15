
import express from 'express';
import cors from 'cors';
import { fetchChartData, fetchPlanetaryPositions, fetchAscendant, fetchDashas } from './services/astrologyService';
import { BirthDetails } from './types/astrology';

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
    res.status(500).json({ error: 'Failed to generate chart' });
  }
});

app.post('/api/planets', async (req, res) => {
  try {
    const birthDetails = req.body as BirthDetails;
    const planets = await fetchPlanetaryPositions(birthDetails);
    res.json(planets);
  } catch (error) {
    console.error('Error fetching planets:', error);
    res.status(500).json({ error: 'Failed to fetch planetary positions' });
  }
});

app.post('/api/ascendant', async (req, res) => {
  try {
    const birthDetails = req.body as BirthDetails;
    const ascendant = await fetchAscendant(birthDetails);
    res.json(ascendant);
  } catch (error) {
    console.error('Error fetching ascendant:', error);
    res.status(500).json({ error: 'Failed to fetch ascendant' });
  }
});

app.post('/api/dashas', async (req, res) => {
  try {
    const birthDetails = req.body as BirthDetails;
    const dashas = await fetchDashas(birthDetails);
    res.json(dashas);
  } catch (error) {
    console.error('Error fetching dashas:', error);
    res.status(500).json({ error: 'Failed to fetch dashas' });
  }
});

// Serve static ephemeris files
app.use('/ephe', express.static('ephe'));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
