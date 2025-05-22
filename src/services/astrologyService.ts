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
import { BirthDetails, ChartData, PlanetaryPositions } from '../types/astrology.js';
import path from 'path';
import fs from 'fs';

/**
 * Normalize angle to range [0, 360)
 */
const normalizeAngle = (angle: number): number => {
  return ((angle % 360) + 360) % 360;
};

// Kiểm tra nếu là kết quả hợp lệ từ swe_calc_ut
function isPlanetCalcResult(res: any): res is {
  longitude: number;
  latitude: number;
  longitudeSpeed: number;
  rflag: number;
} {
  return (
    res &&
    typeof res === 'object' &&
    typeof res.longitude === 'number' &&
    typeof res.latitude === 'number' &&
    typeof res.longitudeSpeed === 'number' &&
    typeof res.rflag === 'number'
  );
}

// Kiểm tra kết quả nhà và ascendant
function isHouseResult(res: any): res is {
  ascendant: number;
  house: number[];
} {
  return (
    res &&
    typeof res === 'object' &&
    typeof res.ascendant === 'number' &&
    Array.isArray(res.house)
  );
}

/**
 * Convert date and time to Julian day
 */
const getJulianDay = (birthDetails: BirthDetails): number => {
  try {
    const { date, time, timezone } = birthDetails;

    // Parse date and time
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);

    // Convert to Julian day (direct calculation without moment.js)
    const julianDay = swisseph.swe_julday(
      year, 
      month, 
      day, 
      hour + minute / 60, 
      GREGORIAN_CALENDAR
    );

    console.log(`Julian Day calculated: ${julianDay} for ${date} ${time}`);
    return julianDay;
  } catch (error) {
    console.error("Error calculating Julian day:", error);
    throw new Error(`Failed to calculate Julian day: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    // Set sidereal mode before calculation
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);

    // Calculate houses using Swiss Ephemeris
    const flag = swisseph.SEFLG_SIDEREAL;

    // Use Whole Sign house system
    const houses = swisseph.swe_houses(
      julianDay,
      latitude,
      longitude,
      DEFAULT_HOUSE_SYSTEM
    );

    // Check if houses is null or an error object
    if (!houses || typeof houses !== 'object' || houses === null) {
      throw new Error(`Failed to calculate houses: Houses object is null or invalid`);
    }

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
    // Return default values if calculation fails
    return { 
      ascendant: 0, 
      houseCusps: Array.from({ length: 12 }, (_, i) => i * 30) 
    };
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
* Calculate planetary positions with manual ayanamsa subtraction for nodes
 */
export const calculatePlanetaryPositions = (
  julianDay: number,
  birthDetails: BirthDetails
): PlanetaryPositions[] => {
  const planets: PlanetaryPositions[] = [];
  const ephePath = process.env.EPHE_PATH || path.resolve(process.cwd(), 'ephe');
  console.log('Ephe path:', ephePath);
  swisseph.swe_set_ephe_path(ephePath);

  // define flags
  const planetFlags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL;
  const nodeFlags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED; // tropical node
  console.log('planetFlags:', planetFlags, 'nodeFlags:', nodeFlags);

  const { ascendant, houseCusps } = calculateHousesWholeSign(
    julianDay,
    birthDetails.latitude,
    birthDetails.longitude
  );
  const ascendantSign = Math.floor(ascendant / 30);

  for (const [planetName, planetId] of Object.entries(PLANETS)) {
    let longitude = 0;
    let latitude = 0;
    let speedLon = 0;
    console.log('Calculating', planetName, 'with id', planetId);

    try {
      if (planetName === 'RAHU') {
        const raw = swisseph.swe_calc_ut(julianDay, swisseph.SE_TRUE_NODE, nodeFlags);
        console.log('RAHU raw:', raw);
        if (!isPlanetCalcResult(raw)) throw new Error('Invalid RAHU');
        const ayanamsa = swisseph.swe_get_ayanamsa_ut(julianDay);
        console.log('ayanamsa:', ayanamsa);
        longitude = normalizeAngle(raw.longitude - ayanamsa);
        latitude = raw.latitude;
        speedLon = raw.longitudeSpeed;
        console.log('RAHU sidereal:', longitude);
      } else if (planetName === 'KETU') {
        // using osculating apogee for Ketu
        const raw = swisseph.swe_calc_ut(julianDay, swisseph.SE_OSCU_APOG, nodeFlags);
        console.log('KETU raw (oscu_apog):', raw);
        if (!isPlanetCalcResult(raw)) throw new Error('Invalid KETU');
        const ayanamsa = swisseph.swe_get_ayanamsa_ut(julianDay);
        longitude = normalizeAngle(raw.longitude - ayanamsa);
        latitude = raw.latitude;
        speedLon = raw.longitudeSpeed;
        console.log('KETU sidereal:', longitude);
      } else {
        const res = swisseph.swe_calc_ut(julianDay, planetId, planetFlags);
        console.log(`${planetName} raw:`, res);
        if (!isPlanetCalcResult(res)) throw new Error(`${planetName} invalid`);
        longitude = normalizeAngle(res.longitude);
        latitude = res.latitude;
        speedLon = res.longitudeSpeed;
        console.log(`${planetName} sidereal:`, longitude);
      }

      if (!isNaN(longitude)) {
        const signIndex = Math.floor(longitude / 30);
        const nakshatraIndex = Math.floor(longitude / (360 / 27)) % 27;
        planets.push({
          planet: planetName,
          longitude,
          latitude,
          sign: ZODIAC_SIGNS[signIndex] || 'Unknown',
          nakshatra: NAKSHATRAS[nakshatraIndex] || 'Unknown',
          house: findHouseWholeSign(longitude, ascendantSign),
          retrograde: speedLon < 0,
        });
      }
    } catch (e) {
      console.error(`Error calculating ${planetName}:`, e);
    }
  }
  return planets;
};


};

/**
 * Calculate Vimshottari Dasha periods 
 */
const calculateDashas = (julianDay: number, moonLongitude: number): any => {
  try {
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
  } catch (error) {
    console.error("Error calculating dashas:", error);
    // Return minimal data structure to avoid crashes
    return {
      current: "Unknown",
      sequence: []
    };
  }
};

/**
 * Main function to fetch chart data
 */
export const fetchChartData = async (birthDetails: BirthDetails): Promise<ChartData> => {
  try {
    console.log("Fetching chart data with birth details:", JSON.stringify(birthDetails));
    
    // Calculate Julian day
    const julianDay = getJulianDay(birthDetails);

    // Set ephemeris path
    const ephePath = process.env.EPHE_PATH || path.resolve(process.cwd(), 'ephe');
    console.log(`Using ephemeris path: ${ephePath}`);
    swisseph.swe_set_ephe_path(ephePath);

    // Always set the sidereal mode first - IMPORTANT for Vedic calculations
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);

    // Calculate ascendant and house cusps using Whole Sign system
    const { ascendant, houseCusps } = calculateHousesWholeSign(
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

    // Calculate planetary positions
    const planetaryPositions = calculatePlanetaryPositions(julianDay, birthDetails);

    // Find Moon's longitude for dasha calculations
    const moon = planetaryPositions.find(p => p.planet === 'MOON');
    const moonLongitude = moon ? moon.longitude : 0;

    // Calculate houses (in Whole Sign system)
    const houses = houseCusps.map((cusp, index) => {
      return {
        house: index + 1,
        sign: ZODIAC_SIGNS[Math.floor(cusp / 30)],
        degree: cusp % 30
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
    const positions = calculatePlanetaryPositions(julianDay, birthDetails);
    
    // Return empty array if no positions were calculated
    if (!positions || positions.length === 0) {
      console.warn("No planetary positions calculated, returning empty array");
      return [];
    }
    
    return positions;
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

    // Set ephemeris path
    const ephePath = process.env.EPHE_PATH || path.resolve(process.cwd(), 'ephe');
    swisseph.swe_set_ephe_path(ephePath);

    // Always set the sidereal mode first
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
  } catch (error: any) {
    console.error('Error fetching ascendant:', error);
    throw new Error(`Failed to fetch ascendant: ${error?.message || 'Unknown error'}`);
  }
};

/**
 * Fetch houses
 */
export const fetchHouses = async (birthDetails: BirthDetails) => {
  try {
    const julianDay = getJulianDay(birthDetails);
    
    // Set ephemeris path
    const ephePath = process.env.EPHE_PATH || path.resolve(process.cwd(), 'ephe');
    swisseph.swe_set_ephe_path(ephePath);
    
    // Always set the sidereal mode first
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
    
    // Calculate houses
    const { houseCusps } = calculateHousesWholeSign(
      julianDay,
      birthDetails.latitude,
      birthDetails.longitude
    );
    
    // Format houses data
    return houseCusps.map((cusp, index) => {
      return {
        house: index + 1,
        sign: ZODIAC_SIGNS[Math.floor(cusp / 30)],
        degree: cusp % 30
      };
    });
  } catch (error: any) {
    console.error('Error fetching houses:', error);
    throw new Error(`Failed to fetch houses: ${error?.message || 'Unknown error'}`);
  }
};

/**
 * Fetch dashas
 */
export const fetchDashas = async (birthDetails: BirthDetails) => {
  try {
    const julianDay = getJulianDay(birthDetails);

    // Set ephemeris path
    const ephePath = process.env.EPHE_PATH || path.resolve(process.cwd(), 'ephe');
    swisseph.swe_set_ephe_path(ephePath);

    // Always set the sidereal mode
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);

    const planetaryPositions = calculatePlanetaryPositions(julianDay, birthDetails);

    const moon = planetaryPositions.find(p => p.planet === 'MOON');
    const moonLongitude = moon ? moon.longitude : 0;

    return calculateDashas(julianDay, moonLongitude);
  } catch (error: any) {
    console.error('Error fetching dashas:', error);
    throw new Error(`Failed to fetch dashas: ${error?.message || 'Unknown error'}`);
  }
};

/**
 * Fetch nakshatra for a specific planet
 */
export const fetchNakshatra = async (birthDetails: BirthDetails, planetName: string) => {
  try {
    const julianDay = getJulianDay(birthDetails);
    
    // Set ephemeris path
    const ephePath = process.env.EPHE_PATH || path.resolve(process.cwd(), 'ephe');
    swisseph.swe_set_ephe_path(ephePath);
    
    // Set sidereal mode
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
    
    const planetaryPositions = calculatePlanetaryPositions(julianDay, birthDetails);
    const planet = planetaryPositions.find(p => p.planet === planetName.toUpperCase());
    
    if (!planet) {
      throw new Error(`Planet ${planetName} not found`);
    }
    
    return {
      planet: planetName.toUpperCase(),
      nakshatra: planet.nakshatra,
      nakshatraLord: NAKSHATRA_LORDS[NAKSHATRAS.indexOf(planet.nakshatra || '')]
    };
  } catch (error: any) {
    console.error(`Error fetching nakshatra for ${planetName}:`, error);
    throw new Error(`Failed to fetch nakshatra: ${error?.message || 'Unknown error'}`);
  }
};
