
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
};

/**
 * Calculate ascendant and house cusps using Whole Sign system
 */
const calculateHousesWholeSign = (julianDay: number, latitude: number, longitude: number): {
  ascendant: number;
  houseCusps: number[];
} => {
  try {
    // Always set the sidereal mode first - IMPORTANT for Vedic calculations
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

    // Check if houses is null or an error object
    if (!houses || 'error' in houses) {
      throw new Error(`Failed to calculate houses: ${houses?.error || 'Unknown error'}`);
    }

    // Now access the ascendant property safely
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
 * Calculate planetary positions
 */
const calculatePlanetaryPositions = (julianDay: number, birthDetails: BirthDetails): PlanetaryPositions[] => {
  const planets: PlanetaryPositions[] = [];

  // Always set the sidereal mode first - IMPORTANT for Vedic calculations
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
      let flag = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL;
      let longitude: number = 0;
      let latitude: number = 0;
      let distance: number = 0;
      let longitudeSpeed: number = 0;
      let latitudeSpeed: number = 0;
      let distanceSpeed: number = 0;
      let status: number = 0;

      // Special calculation for Ketu (South Node)
      if (planetName === 'KETU') {
        // Get Rahu position first
        const calcResult = swisseph.swe_calc_ut(julianDay, PLANETS.RAHU, flag);
        
        // Make sure calcResult is an array with at least 2 elements
        if (Array.isArray(calcResult) && calcResult.length >= 2) {
          const xx = calcResult[0];
          const ret = calcResult[1];
          
          // Ensure xx is an array with the expected properties
          if (Array.isArray(xx) && xx.length >= 6) {
            // Ketu is 180° opposite to Rahu
            longitude = normalizeAngle(xx[0] + 180);
            latitude = -xx[1]; // Opposite latitude
            distance = xx[2];
            longitudeSpeed = -xx[3]; // Opposite speed
            latitudeSpeed = -xx[4];
            distanceSpeed = xx[5];
            status = ret;
          } else {
            console.error(`Invalid xx format for ${planetName}`);
            continue;
          }
        } else {
          console.error(`Invalid calcResult format for ${planetName}`);
          continue;
        }
      } else {
        // For all other planets
        const calcResult = swisseph.swe_calc_ut(julianDay, planetId, flag);
        
        // Make sure calcResult is an array with at least 2 elements
        if (Array.isArray(calcResult) && calcResult.length >= 2) {
          const xx = calcResult[0];
          const ret = calcResult[1];
          
          // Ensure xx is an array with the expected properties
          if (Array.isArray(xx) && xx.length >= 6) {
            longitude = xx[0];
            latitude = xx[1];
            distance = xx[2];
            longitudeSpeed = xx[3];
            latitudeSpeed = xx[4];
            distanceSpeed = xx[5];
            status = ret;
          } else {
            console.error(`Invalid xx format for ${planetName}`);
            continue;
          }
        } else {
          console.error(`Invalid calcResult format for ${planetName}`);
          continue;
        }
      }

      
      if (status < 0) {
        console.error(`Error calculating ${planetName}:`, status);
        continue;
      }
      
      // Normalize the longitude to ensure it's between 0 and 360
      const siderealLongitude = normalizeAngle(longitude);
      
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
    } catch (error) {
      console.error(`Error calculating position for ${planetName}:`, error);
      // Skip this planet and continue with others
    }
  }
    

     return planets;
  };
  //Calculate Vimshottari Dasha periods 
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
    return calculatePlanetaryPositions(julianDay, birthDetails);
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
 * Fetch dashas
 */
export const fetchDashas = async (birthDetails: BirthDetails) => {
  try {
    const julianDay = getJulianDay(birthDetails);

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