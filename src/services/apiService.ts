import { BirthDetails, ChartData } from "../types/astrology.js";

// Base URL for API calls with fallback
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:10000/api';

// Fetch chart data from API
export const fetchChartData = async (birthDetails: BirthDetails): Promise<ChartData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(birthDetails),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
    return await response.json() as ChartData;
  } catch (error) {
    console.error('Error fetching chart data:', error);
    throw error;
  }
};

// Fetch planetary positions from API
export const fetchPlanetaryPositions = async (birthDetails: BirthDetails) => {
  try {
    const response = await fetch(`${API_BASE_URL}/planets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(birthDetails),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching planetary positions:', error);
    throw error;
  }
};

// Fetch ascendant from API
export const fetchAscendant = async (birthDetails: BirthDetails) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ascendant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(birthDetails),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching ascendant:', error);
    throw error;
  }
};

// Fetch dashas from API
export const fetchDashas = async (birthDetails: BirthDetails) => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(birthDetails),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching dashas:', error);
    throw error;
  }
};