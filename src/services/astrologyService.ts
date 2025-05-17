
import swisseph, { 
  ZODIAC_SIGNS, 
  NAKSHATRAS, 
  PLANETS, 
  DASHA_PERIODS, 
  NAKSHATRA_LORDS, 
  DEFAULT_HOUSE_SYSTEM,
  DEFAULT_AYANAMSA,
  GREGORIAN_CALENDAR
} from '../config/swissephConfig.js';
import { BirthDetails, ChartData, PlanetaryPosition } from '../types/astrology.js';

/**
 * Convert date and time to Julian day
 */
const getJulianDay = (birthDetails: BirthDetails): number => {
  const { date, time, timezone } = birthDetails;
  
  // Parse date and time
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  
  // Convert to Julian day
  const julianDay = swisseph.swe_julday(
    year, 
    month, 
    day, 
    hour + minute / 60, 
    GREGORIAN_CALENDAR
  );
  
  return julianDay;
};

/**
 * Calculate ayanamsa (precession)
 */
const calculateAyanamsa = (julianDay: number): number => {
  // Use default ayanamsa (Lahiri in Vedic)
  return swisseph.swe_get_ayanamsa(julianDay);
};

// Define types for SwissEph returns to handle various return formats
interface SwissEphPlanetResult {
  longitude?: number;
  latitude?: number;
  distance?: number;
  longitudeSpeed?: number;
  latitudeSpeed?: number;
  distanceSpeed?: number;
  rflag?: number;
  // For equatorial coords
  rectAscension?: number;
  declination?: number;
  rectAscensionSpeed?: number;
  declinationSpeed?: number;
  // Add status field for error checking
  status?: number;
  error?: string;
  // Legacy fields (may be present in some versions of swisseph)
  speedLong?: number;
  lat?: number;
}

/**
 * Calculate planetary positions
 */
const calculatePlanetaryPositions = (
  julianDay: number, 
  ayanamsa: number, 
  housePositions: number[]
): PlanetaryPosition[] => {
  const planets: PlanetaryPosition[] = [];
  
  // Calculate for each planet
  for (const [planetName, planetId] of Object.entries(PLANETS)) {
    let flag = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;
    let result: SwissEphPlanetResult;
    
    // Special calculation for Ketu (South Node)
    if (planetName === 'KETU') {
      // Get Rahu position first
      const rahuResult = swisseph.swe_calc_ut(julianDay, PLANETS.RAHU, flag) as SwissEphPlanetResult;
      // Ketu is 180° opposite to Rahu
      result = { ...rahuResult };
      if (result.longitude !== undefined) {
        result.longitude = (result.longitude + 180) % 360;
      }
    } else {
      result = swisseph.swe_calc_ut(julianDay, planetId, flag) as SwissEphPlanetResult;
    }
    
    if (result.status && result.status < 0) {
      console.error(`Error calculating ${planetName}:`, result.error || 'Unknown error');
      continue;
    }
    
    // Check if we have valid longitude data
    if (result.longitude === undefined) {
      console.error(`Missing longitude data for ${planetName}`);
      continue;
    }
    
    // Convert tropical longitude to sidereal by subtracting ayanamsa
    const siderealLongitude = (result.longitude - ayanamsa + 360) % 360;
    
    // Determine zodiac sign
    const signIndex = Math.floor(siderealLongitude / 30);
    const sign = ZODIAC_SIGNS[signIndex];
    
    // Determine nakshatra (27 nakshatras of 13°20' each)
    const nakshatraIndex = Math.floor(siderealLongitude / (13 + 1/3));
    const nakshatra = NAKSHATRAS[nakshatraIndex];
    
    // Determine house
    const house = findHouse(siderealLongitude, housePositions);
    
    // Detect retrograde motion - handle different property names for retrograde detection
    const retrograde = result.longitudeSpeed !== undefined 
      ? result.longitudeSpeed < 0 
      : (result.speedLong !== undefined ? result.speedLong < 0 : false);
    
    planets.push({
      planet: planetName,
      longitude: siderealLongitude,
      latitude: result.latitude || result.lat || 0, // Handle both property names
      house,
      sign,
      nakshatra,
      retrograde
    });
  }
  
  return planets;
};

/**
 * Find which house a planet belongs to based on its longitude
 */
const findHouse = (longitude: number, housePositions: number[]): number => {
  // ... keep existing code (house calculation function)
  
  // Check if longitude is between this house cusp and next
  for (let i = 0; i < 12; i++) {
    const nextHouse = (i + 1) % 12;
    if (i === 11) {
      if ((longitude >= housePositions[i]) || (longitude < housePositions[nextHouse])) {
        return i + 1;
      }
    } else if (longitude >= housePositions[i] && longitude < housePositions[nextHouse]) {
      return i + 1;
    }
  }
  return 1; // Default to first house if something goes wrong
};

// Define interface for house calculation result
interface HouseResult {
  house?: number[];
  ascendant?: number;
  mc?: number;
  armc?: number;
  vertex?: number;
  equatorialAscendant?: number;
  kochCoAscendant?: number;
  munkaseyCoAscendant?: number;
  munkaseyPolarAscendant?: number;
  error?: string;
}

/**
 * Calculate house cusps
 */
const safeCalculateHouses = (julianDay: number, latitude: number, longitude: number): number[] => {
  // ... keep existing code (house cusps calculation)
  try {
    const houses = swisseph.swe_houses(
      julianDay, 
      latitude, 
      longitude, 
      DEFAULT_HOUSE_SYSTEM as string
    ) as HouseResult;
    
    if (!houses || !houses.house) {
      throw new Error("Failed to calculate houses");
    }
    
    return houses.house;
  } catch (error) {
    console.error("Error calculating houses:", error);
    // Return default house cusps (30° each starting from 0°)
    return Array.from({ length: 12 }, (_, i) => i * 30);
  }
};

/**
 * Calculate Vimshottari Dasha periods
 */
const calculateDashas = (julianDay: number, moonLongitude: number): any => {
  // Calculate Moon's nakshatra position (0-27)
  const totalNakshatraSpan = 360;
  const nakshatraCount = 27;
  const nakshatraLength = totalNakshatraSpan / nakshatraCount;
  const nakshatraPosition = moonLongitude / nakshatraLength;
  const nakshatraIndex = Math.floor(nakshatraPosition);
  
  // Calculate the percentage of nakshatra traversed
  const nakshatraProgressPercent = (nakshatraPosition - nakshatraIndex);
  
  // Find the lord of birth nakshatra
  const birthNakshatraLord = NAKSHATRA_LORDS[nakshatraIndex];
  
  // Type-safe access to DASHA_PERIODS
  const getDashaPeriod = (lord: string): number => {
    if (lord in DASHA_PERIODS) {
      return (DASHA_PERIODS as Record<string, number>)[lord];
    }
    return 0; // Default if not found
  };
  
  // Calculate remaining portion of the dasha at birth
  const birthDashaLordPeriod = getDashaPeriod(birthNakshatraLord);
  const remainingDashaYears = birthDashaLordPeriod * (1 - nakshatraProgressPercent);
  
  // Find dasha sequence starting from birth nakshatra lord
  const dashaSequence = [];
  const lordIndex = NAKSHATRA_LORDS.indexOf(birthNakshatraLord);
  const uniqueLords = [...new Set(NAKSHATRA_LORDS)];
  
  for (let i = 0; i < uniqueLords.length; i++) {
    const index = (lordIndex + i) % uniqueLords.length;
    dashaSequence.push(uniqueLords[index]);
  }
  
  // Calculate end dates for each dasha
  const dashas = [];
  let currentDate = new Date();
  
  // Add birth dasha with remaining years
  dashas.push({
    planet: birthNakshatraLord,
    endDate: new Date(currentDate.getTime() + remainingDashaYears * 365.25 * 24 * 60 * 60 * 1000)
  });
  
  // Add subsequent dashas
  for (let i = 1; i < dashaSequence.length; i++) {
    const planet = dashaSequence[i];
    const periodYears = getDashaPeriod(planet);
    currentDate = new Date(currentDate.getTime() + periodYears * 365.25 * 24 * 60 * 60 * 1000);
    dashas.push({
      planet,
      endDate: new Date(currentDate)
    });
  }
  
  return {
    current: birthNakshatraLord,
    sequence: dashas
  };
};

/**
 * Main function to fetch chart data
 */
export const fetchChartData = async (birthDetails: BirthDetails): Promise<ChartData> => {
  try {
    // Calculate Julian day
    const julianDay = getJulianDay(birthDetails);
    
    // Calculate ayanamsa
    const ayanamsa = calculateAyanamsa(julianDay);
    
    // Calculate house cusps
    const houseCusps = safeCalculateHouses(
      julianDay, 
      birthDetails.latitude, 
      birthDetails.longitude
    );
    
    // Calculate planetary positions
    const planetaryPositions = calculatePlanetaryPositions(julianDay, ayanamsa, houseCusps);
    
    // Find Moon's longitude for dasha calculations
    const moon = planetaryPositions.find(p => p.planet === 'MOON');
    const moonLongitude = moon ? moon.longitude : 0;
    
    // Calculate ascendant (first house cusp)
    const ascendantLongitude = (houseCusps[0] - ayanamsa + 360) % 360;
    const ascendantSign = ZODIAC_SIGNS[Math.floor(ascendantLongitude / 30)];
    const ascendantNakshatraIndex = Math.floor(ascendantLongitude / (13 + 1/3));
    const ascendantNakshatra = NAKSHATRAS[ascendantNakshatraIndex];
    
    // Calculate houses
    const houses = houseCusps.map((cusp, index) => {
      const siderealCusp = (cusp - ayanamsa + 360) % 360;
      return {
        house: index + 1,
        sign: ZODIAC_SIGNS[Math.floor(siderealCusp / 30)],
        degree: siderealCusp % 30
      };
    });
    
    // Calculate dashas
    const dashas = calculateDashas(julianDay, moonLongitude);
    
    // Return the complete chart data
    return {
      ascendant: {
        sign: ascendantSign,
        degree: ascendantLongitude % 30,
        nakshatra: ascendantNakshatra
      },
      planets: planetaryPositions,
      houses,
      dashas
    };
  } catch (error: any) {
    console.error('Error generating chart:', error);
    throw new Error(`Failed to generate chart: ${error?.message || 'Unknown error'}`);
  }
};

/**
 * Fetch planetary positions
 */
export const fetchPlanetaryPositions = async (birthDetails: BirthDetails) => {
  try {
    const julianDay = getJulianDay(birthDetails);
    const ayanamsa = calculateAyanamsa(julianDay);
    const houseCusps = safeCalculateHouses(julianDay, birthDetails.latitude, birthDetails.longitude);
    return calculatePlanetaryPositions(julianDay, ayanamsa, houseCusps);
  } catch (error: any) {
    console.error('Error fetching planetary positions:', error);
    throw new Error(`Failed to fetch planetary positions: ${error?.message || 'Unknown error'}`);
  }
};

/**
 * Fetch ascendant
 */
export const fetchAscendant = async (birthDetails: BirthDetails) => {
  try {
    const julianDay = getJulianDay(birthDetails);
    const ayanamsa = calculateAyanamsa(julianDay);
    const houseCusps = safeCalculateHouses(julianDay, birthDetails.latitude, birthDetails.longitude);
    
    const ascendantLongitude = (houseCusps[0] - ayanamsa + 360) % 360;
    const ascendantSign = ZODIAC_SIGNS[Math.floor(ascendantLongitude / 30)];
    const ascendantNakshatraIndex = Math.floor(ascendantLongitude / (13 + 1/3));
    const ascendantNakshatra = NAKSHATRAS[ascendantNakshatraIndex];
    
    return {
      sign: ascendantSign,
      degree: ascendantLongitude % 30,
      nakshatra: ascendantNakshatra
    };
  } catch (error: any) {
    console.error('Error fetching ascendant:', error);
    throw new Error(`Failed to fetch ascendant: ${error?.message || 'Unknown error'}`);
  }
};

/**
 * Fetch dashas
 */
export const fetchDashas = async (birthDetails: BirthDetails) => {
  try {
    const julianDay = getJulianDay(birthDetails);
    const ayanamsa = calculateAyanamsa(julianDay);
    const houseCusps = safeCalculateHouses(julianDay, birthDetails.latitude, birthDetails.longitude);
    const planetaryPositions = calculatePlanetaryPositions(julianDay, ayanamsa, houseCusps);
    
    const moon = planetaryPositions.find(p => p.planet === 'MOON');
    const moonLongitude = moon ? moon.longitude : 0;
    
    return calculateDashas(julianDay, moonLongitude);
  } catch (error: any) {
    console.error('Error fetching dashas:', error);
    throw new Error(`Failed to fetch dashas: ${error?.message || 'Unknown error'}`);
  }
};
