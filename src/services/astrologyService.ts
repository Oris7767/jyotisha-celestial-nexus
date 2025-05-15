
import { BirthDetails, ChartData } from "@/types/astrology";

// This is a placeholder service that will connect to your external Node.js Swiss Ephemeris API
// You will need to update the API_URL with your actual server URL once it's deployed
const API_URL = "https://your-vedic-astro-api.com/api";

export const fetchChartData = async (birthDetails: BirthDetails): Promise<ChartData> => {
  try {
    const response = await fetch(`${API_URL}/chart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(birthDetails),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch chart data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching chart data:', error);
    throw error;
  }
};

export const fetchPlanetaryPositions = async (birthDetails: BirthDetails) => {
  try {
    const response = await fetch(`${API_URL}/planets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(birthDetails),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch planetary positions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching planetary positions:', error);
    throw error;
  }
};

export const fetchAscendant = async (birthDetails: BirthDetails) => {
  try {
    const response = await fetch(`${API_URL}/ascendant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(birthDetails),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch ascendant data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching ascendant data:', error);
    throw error;
  }
};

export const fetchDashas = async (birthDetails: BirthDetails) => {
  try {
    const response = await fetch(`${API_URL}/dashas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(birthDetails),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dasha data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching dasha data:', error);
    throw error;
  }
};
