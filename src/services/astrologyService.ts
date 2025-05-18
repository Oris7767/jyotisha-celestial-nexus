
import swisseph from '../config/swissephConfig.js';
import { 
  ZODIAC_SIGNS, 
  NAKSHATRAS, 
  PLANETS, 
  DASHA_PERIODS, 
  NAKSHATRA_LORDS,
  DEFAULT_HOUSE_SYSTEM
} from '../config/swissephConfig.js';
import { BirthDetails, ChartData, PlanetaryPosition, HousePosition, Ascendant, Dasha } from '../types/astrology.js';

/**
 * Normalize angle to range [0, 360)
 */
const normalizeAngle = (angle: number): number => {
  return ((angle % 360) + 360) % 360;
};

/**
 * Convert date and time to Julian day
 */
const getJulianDay = (birthDetails: BirthDetails): number => {
  try {
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
      swisseph.SE_GREG_CAL
    );
    
    console.log(`Julian Day calculated: ${julianDay} for ${date} ${time}`);
    return julianDay;
  } catch (error) {
    console.error('Error calculating Julian day:', error);
    throw new Error(`Failed to calculate Julian day: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Calculate ascendant and house cusps using Whole Sign system
 */
const calculateHousesWholeSign = (julianDay: number, latitude: number, longitude: number): {
  ascendant: number;
  houseCusps: number[];
} => {
  try {
    // Set sidereal mode for Vedic calculations
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
    
    // Calculate houses using Swiss Ephemeris
    const flag = swisseph.SEFLG_SIDEREAL; // Use sidereal zodiac
    
    // Use Whole Sign house system
    const houses = swisseph.swe_houses(
      julianDay,
      latitude,
      longitude,
      'W' // Whole Sign house system
    );

    // Check if houses object is valid and has the ascendant property
    if (!houses || typeof houses === 'object' && 'error' in houses) {
      throw new Error(`Failed to calculate houses: ${houses?.error || 'Unknown error'}`);
    }

    // Safely access the ascendant
    const ascendant = houses.ascendant;
    
    // In Whole Sign system, houses start at 0° of the sign containing the ascendant
    // and each house spans exactly 30°
    const ascSign = Math.floor(ascendant / 30);
    
    // Generate whole sign house cusps (each house starts at 0° of a sign)
    const houseCusps: number[] = [];
    for (let i = 0; i < 12; i++) {
      // Calculate house cusp as 0° of the appropriate sign
      // Ascendant's sign is the 1st house, then we go counterclockwise
      const sign = (ascSign + i) % 12;
      houseCusps.push(sign * 30);
    }
    
    return { ascendant, houseCusps };
  } catch (error) {
    console.error("Error calculating houses:", error);
    throw new Error(`Failed to calculate houses: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Find which house a planet belongs to based on its longitude (Whole Sign system)
 */
const findHouseWholeSign = (longitude: number, ascendantSign: number): number => {
  // Get the sign of the planet
  const planetSign = Math.floor(longitude / 30);
  
  // Calculate house (1-based)
  // If ascendantSign is 0 (Aries), then Aries is 1st house, Taurus is 2nd, etc.
  // If ascendantSign is 1 (Taurus), then Taurus is 1st house, Gemini is 2nd, etc.
  let house = (planetSign - ascendantSign + 12) % 12 + 1;
  
  return house;
};

/**
 * Calculate planetary positions
 */
const calculatePlanetaryPositions = (julianDay: number, birthDetails: BirthDetails): PlanetaryPosition[] => {
  try {
    const planets: PlanetaryPosition[] = [];
    
    // Set sidereal mode for Vedic calculations
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
    
    // Get ascendant to determine house positions in Whole Sign system
    const { ascendant, houseCusps } = calculateHousesWholeSign(
      julianDay, 
      birthDetails.latitude, 
      birthDetails.longitude
    );
    
    const ascendantSign = Math.floor(ascendant / 30);
    
    // Calculate for each planet
    for (const [planetName, planetId] of Object.entries(PLANETS)) {
      try {
        const flag = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL;
        let calcResult;
        
        // Special calculation for Ketu (South Node)
        if (planetName === 'KETU') {
          // Get Rahu position first
          calcResult = swisseph.swe_calc_ut(julianDay, PLANETS.RAHU, flag);
          
          if (!calcResult || !Array.isArray(calcResult) || calcResult.length < 2) {
            throw new Error(`Invalid calculation result for RAHU`);
          }
          
          const xx = calcResult[0];
          const ret = calcResult[1];
          
          if (!xx || !Array.isArray(xx) || xx.length < 6) {
            throw new Error(`Invalid position array for RAHU`);
          }
          
          // Ketu is 180° opposite to Rahu
          const siderealLongitude = normalizeAngle(xx[0] + 180);
          const latitude = -xx[1]; // Opposite latitude
          const distance = xx[2];
          const longitudeSpeed = -xx[3]; // Opposite speed
          const retrograde = longitudeSpeed < 0;
          
          // Determine zodiac sign
          const signIndex = Math.floor(siderealLongitude / 30);
          const sign = ZODIAC_SIGNS[signIndex];
          
          // Determine nakshatra (27 nakshatras of 13°20' each)
          const nakshatraIndex = Math.floor(siderealLongitude / (360/27)) % 27;
          const nakshatra = NAKSHATRAS[nakshatraIndex];
          
          // Determine house (Whole Sign system)
          const house = findHouseWholeSign(siderealLongitude, ascendantSign);
          
          planets.push({
            planet: planetName,
            longitude: siderealLongitude,
            latitude: latitude,
            house,
            sign,
            nakshatra,
            retrograde
          });
        } else {
          // For all other planets
          calcResult = swisseph.swe_calc_ut(julianDay, planetId, flag);
          
          if (!calcResult || !Array.isArray(calcResult) || calcResult.length < 2) {
            throw new Error(`Invalid calculation result for ${planetName}`);
          }
          
          const xx = calcResult[0];
          const ret = calcResult[1];
          
          if (!xx || !Array.isArray(xx) || xx.length < 6) {
            throw new Error(`Invalid position array for ${planetName}`);
          }
          
          const siderealLongitude = normalizeAngle(xx[0]);
          const latitude = xx[1];
          const longitudeSpeed = xx[3];
          
          // Determine zodiac sign
          const signIndex = Math.floor(siderealLongitude / 30);
          const sign = ZODIAC_SIGNS[signIndex];
          
          // Determine nakshatra (27 nakshatras of 13°20' each)
          const nakshatraIndex = Math.floor(siderealLongitude / (360/27)) % 27;
          const nakshatra = NAKSHATRAS[nakshatraIndex];
          
          // Determine house (Whole Sign system)
          const house = findHouseWholeSign(siderealLongitude, ascendantSign);
          
          // Detect retrograde motion
          const retrograde = longitudeSpeed < 0;
          
          planets.push({
            planet: planetName,
            longitude: siderealLongitude,
            latitude: latitude,
            house,
            sign,
            nakshatra,
            retrograde
          });
        }
      } catch (error) {
        console.error(`Error calculating position for ${planetName}:`, error);
        // Skip this planet and continue with others
      }
    }
    
    return planets;
  } catch (error) {
    console.error('Error calculating planetary positions:', error);
    throw new Error(`Failed to calculate planetary positions: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Calculate house positions
 */
const calculateHousePositions = (julianDay: number, birthDetails: BirthDetails): HousePosition[] => {
  try {
    // Calculate houses
    const { ascendant, houseCusps } = calculateHousesWholeSign(
      julianDay, 
      birthDetails.latitude, 
      birthDetails.longitude
    );
    
    // Create house positions array
    const houses: HousePosition[] = houseCusps.map((cusp, index) => {
      return {
        house: index + 1,
        sign: ZODIAC_SIGNS[Math.floor(cusp / 30)],
        degree: cusp % 30
      };
    });
    
    return houses;
  } catch (error) {
    console.error('Error calculating house positions:', error);
    throw new Error(`Failed to calculate house positions: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Calculate the ascendant
 */
const calculateAscendant = (julianDay: number, birthDetails: BirthDetails): Ascendant => {
  try {
    // Set sidereal mode
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
    
    // Calculate ascendant
    const { ascendant } = calculateHousesWholeSign(
      julianDay, 
      birthDetails.latitude, 
      birthDetails.longitude
    );
    
    // Normalize ascendant value
    const ascendantLongitude = normalizeAngle(ascendant);
    const ascendantSign = ZODIAC_SIGNS[Math.floor(ascendantLongitude / 30)];
    
    // Calculate nakshatra for ascendant
    const ascendantNakshatraIndex = Math.floor(ascendantLongitude / (360/27)) % 27;
    const ascendantNakshatra = NAKSHATRAS[ascendantNakshatraIndex];
    
    return {
      sign: ascendantSign,
      degree: ascendantLongitude % 30,
      nakshatra: ascendantNakshatra
    };
  } catch (error) {
    console.error('Error calculating ascendant:', error);
    throw new Error(`Failed to calculate ascendant: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get nakshatra for a specific planet
 */
const getNakshatraForPlanet = (
  julianDay: number, 
  birthDetails: BirthDetails, 
  planetName: string
): { planet: string, nakshatra: string, ruler: string, degree: number } | null => {
  try {
    // Calculate all planetary positions
    const planets = calculatePlanetaryPositions(julianDay, birthDetails);
    
    // Find the requested planet
    const planet = planets.find(p => p.planet === planetName.toUpperCase());
    
    if (!planet) {
      return null;
    }

    // Calculate nakshatra details
    const nakshatraLength = 360 / 27; // Each nakshatra is 13°20' long
    const nakshatraIndex = Math.floor(planet.longitude / nakshatraLength) % 27;
    const nakshatra = NAKSHATRAS[nakshatraIndex];
    const ruler = NAKSHATRA_LORDS[nakshatraIndex];
    const degreeInNakshatra = planet.longitude % nakshatraLength;
    
    return {
      planet: planet.planet,
      nakshatra: nakshatra,
      ruler: ruler,
      degree: degreeInNakshatra
    };
  } catch (error) {
    console.error(`Error getting nakshatra for planet ${planetName}:`, error);
    throw new Error(`Failed to get nakshatra for planet ${planetName}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Calculate Vimshottari Dasha periods
 */
const calculateDashas = (julianDay: number, birthDetails: BirthDetails): Dasha => {
  try {
    // Get Moon's position first
    const planets = calculatePlanetaryPositions(julianDay, birthDetails);
    const moon = planets.find(p => p.planet === 'MOON');
    
    if (!moon) {
      throw new Error("Moon's position could not be calculated");
    }
    
    const moonLongitude = moon.longitude;
    
    // Normalize Moon's longitude to ensure it's between 0 and 360
    const normalizedMoonLongitude = normalizeAngle(moonLongitude);
    
    // Calculate Moon's nakshatra position (0-27)
    const totalNakshatraSpan = 360;
    const nakshatraCount = 27;
    const nakshatraLength = totalNakshatraSpan / nakshatraCount;
    const nakshatraPosition = normalizedMoonLongitude / nakshatraLength;
    const nakshatraIndex = Math.floor(nakshatraPosition) % 27;
    
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
    const uniqueLords = Array.from(new Set(NAKSHATRA_LORDS));
    
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
  } catch (error) {
    console.error("Error calculating dashas:", error);
    throw new Error(`Failed to calculate dashas: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Generate full chart data
 */
export const fetchChartData = async (birthDetails: BirthDetails): Promise<ChartData> => {
  try {
    console.log("Fetching chart data with birth details:", JSON.stringify(birthDetails));
    
    // Calculate Julian day
    const julianDay = getJulianDay(birthDetails);
    
    // Calculate ascendant
    const ascendant = calculateAscendant(julianDay, birthDetails);
    
    // Calculate planetary positions
    const planets = calculatePlanetaryPositions(julianDay, birthDetails);
    
    // Calculate houses
    const houses = calculateHousePositions(julianDay, birthDetails);
    
    // Calculate dashas
    const dashas = calculateDashas(julianDay, birthDetails);
    
    // Return the complete chart data
    return {
      ascendant,
      planets,
      houses,
      dashas
    };
  } catch (error) {
    console.error('Error generating chart:', error);
    throw new Error(`Failed to generate chart: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Fetch planetary positions
 */
export const fetchPlanetaryPositions = async (birthDetails: BirthDetails): Promise<PlanetaryPosition[]> => {
  try {
    const julianDay = getJulianDay(birthDetails);
    return calculatePlanetaryPositions(julianDay, birthDetails);
  } catch (error) {
    console.error('Error fetching planetary positions:', error);
    throw new Error(`Failed to fetch planetary positions: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Fetch house positions
 */
export const fetchHousePositions = async (birthDetails: BirthDetails): Promise<HousePosition[]> => {
  try {
    const julianDay = getJulianDay(birthDetails);
    return calculateHousePositions(julianDay, birthDetails);
  } catch (error) {
    console.error('Error fetching house positions:', error);
    throw new Error(`Failed to fetch house positions: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Fetch ascendant
 */
export const fetchAscendant = async (birthDetails: BirthDetails): Promise<Ascendant> => {
  try {
    const julianDay = getJulianDay(birthDetails);
    return calculateAscendant(julianDay, birthDetails);
  } catch (error) {
    console.error('Error fetching ascendant:', error);
    throw new Error(`Failed to fetch ascendant: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Fetch nakshatra for a planet
 */
export const fetchNakshatraForPlanet = async (birthDetails: BirthDetails, planetName: string) => {
  try {
    const julianDay = getJulianDay(birthDetails);
    return getNakshatraForPlanet(julianDay, birthDetails, planetName);
  } catch (error) {
    console.error(`Error fetching nakshatra for planet ${planetName}:`, error);
    throw new Error(`Failed to fetch nakshatra for planet ${planetName}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Fetch dashas
 */
export const fetchDashas = async (birthDetails: BirthDetails): Promise<Dasha> => {
  try {
    const julianDay = getJulianDay(birthDetails);
    return calculateDashas(julianDay, birthDetails);
  } catch (error) {
    console.error('Error fetching dashas:', error);
    throw new Error(`Failed to fetch dashas: ${error instanceof Error ? error.message : String(error)}`);
  }
};
