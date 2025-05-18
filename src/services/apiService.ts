
import { BirthDetails, ChartData } from "../types/astrology.js";

// Base URL for API calls with fallback
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:10000/api';

/**
 * Fetch complete chart data from API
 * @param birthDetails Birth details for chart calculation
 * @returns Complete chart data including ascendant, planets, houses and dashas
 */
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

    return await response.json() as ChartData;
  } catch (error) {
    console.error('Error fetching chart data:', error);
    throw error;
  }
};

/**
 * Fetch full chart data (alias for fetchChartData)
 * @param birthDetails Birth details for chart calculation
 * @returns Complete chart data
 */
export const fetchFullChart = async (birthDetails: BirthDetails): Promise<ChartData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/fullchart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(birthDetails),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json() as ChartData;
  } catch (error) {
    console.error('Error fetching full chart data:', error);
    throw error;
  }
};

/**
 * Fetch planetary positions from API
 * @param birthDetails Birth details for planetary position calculation
 * @returns Array of planetary positions
 */
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

/**
 * Fetch house positions from API
 * @param birthDetails Birth details for house calculation
 * @returns Array of house positions
 */
export const fetchHouses = async (birthDetails: BirthDetails) => {
  try {
    const response = await fetch(`${API_BASE_URL}/houses`, {
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
    console.error('Error fetching house positions:', error);
    throw error;
  }
};

/**
 * Fetch ascendant from API
 * @param birthDetails Birth details for ascendant calculation
 * @returns Ascendant information (sign, degree, nakshatra)
 */
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

/**
 * Fetch dashas from API
 * @param birthDetails Birth details for dasha calculation
 * @returns Dasha periods
 */
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

/**
 * Fetch nakshatra for a specific planet
 * @param birthDetails Birth details for nakshatra calculation
 * @param planetName Name of the planet (e.g., "MOON", "SUN", etc.)
 * @returns Nakshatra details for the specified planet
 */
export const fetchNakshatraForPlanet = async (birthDetails: BirthDetails, planetName: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/nakshatra?planet=${encodeURIComponent(planetName)}`, {
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
    console.error(`Error fetching nakshatra for planet ${planetName}:`, error);
    throw error;
  }
};
