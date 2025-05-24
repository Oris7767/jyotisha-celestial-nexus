import swisseph, { 
  ZODIAC_SIGNS, 
  NAKSHATRAS, 
  PLANETS, 
  DASHA_PERIODS, 
  NAKSHATRA_LORDS, 
  DEFAULT_HOUSE_SYSTEM,
  DEFAULT_AYANAMSA,
  GREGORIAN_CALENDAR,
  DashaPlanet
} from '../config/swissephConfig.js';
import { 
  BirthDetails, 
  ChartData, 
  PlanetaryPositions, 
  SwissEphResponse,
  NakshatraInfo,
  DashaInfo,
  NakshatraResponse,
  DashaDetail
} from '../types/astrology.js';
import path from 'path';
import fs from 'fs';
import moment from 'moment-timezone';
import { convertToUTC } from '../utils/timeUtils.js';

// Swiss Ephemeris initialization state
let swissephInitialized = false;

const initializeSwissEph = () => {
  if (swissephInitialized) return;

  try {
    const ephePath = process.env.EPHE_PATH || path.resolve(process.cwd(), 'ephe');
    console.log('Initializing Swiss Ephemeris with path:', ephePath);
    
    swisseph.swe_set_ephe_path(ephePath);
    
    // Test calculation
    const testDate = new Date();
    const jd = swisseph.swe_julday(
      testDate.getFullYear(),
      testDate.getMonth() + 1,
      testDate.getDate(),
      testDate.getHours(),
      swisseph.SE_GREG_CAL
    );
    
    const result = swisseph.swe_calc_ut(jd, swisseph.SE_SUN, swisseph.SEFLG_SWIEPH);
    if ('error' in result) {
      throw new Error(`Swiss Ephemeris test calculation failed: ${result.error}`);
    }
    
    swissephInitialized = true;
    console.log('Swiss Ephemeris initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Swiss Ephemeris:', error);
    throw error;
  }
};

// Initialize Swiss Ephemeris when module is loaded
initializeSwissEph();

// Logging utility
const logAstrologyCalculation = (stage: string, input: any, output: any, error?: any) => {
  console.log(`[Astrology Calculation] ${stage}:`, {
    timestamp: new Date().toISOString(),
    input,
    output,
    error: error ? {
      message: error.message,
      stack: error.stack
    } : undefined
  });
};

/**
 * Normalize angle to range [0, 360)
 */
const normalizeAngle = (angle: number): number => {
  return ((angle % 360) + 360) % 360;
};

/**
 * Convert date and time to Julian day
 * This function now uses the timeUtils for timezone conversion
 */
const getJulianDay = (birthDetails: BirthDetails): number => {
  try {
    // Convert local time to UTC using the utility function
    const utcDateTime = convertToUTC(birthDetails);
    
    // Convert to Julian Day using Swiss Ephemeris
    const julianDay = swisseph.swe_julday(
      utcDateTime.year,
      utcDateTime.month,
      utcDateTime.day,
      utcDateTime.hour + utcDateTime.minute/60.0,
      swisseph.SE_GREG_CAL
    );

    console.log('Julian Day calculation:', {
      input: birthDetails,
      utc: utcDateTime,
      julianDay
    });

    return julianDay;
  } catch (error) {
    console.error("Error calculating Julian day:", error);
    throw new Error(`Failed to calculate Julian day: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Calculate ascendant position
 */
const calculateAscendant = (julianDay: number, latitude: number, longitude: number): number => {
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
    if (!houses || typeof houses === 'object' && 'error' in houses) {
      throw new Error(`Failed to calculate houses: ${(houses as any)?.error || 'Houses object is null or invalid'}`);
    }

    return houses.ascendant;
  } catch (error) {
    console.error("Error calculating ascendant:", error);
    return 0;
  }
};

/**
 * Calculate houses using Whole Sign system
 */
const calculateHousesWholeSign = (julianDay: number, latitude: number, longitude: number): {
  ascendant: number;
  houseCusps: number[];
} => {
  try {
    // Set sidereal mode before calculation
    swisseph.swe_set_sid_mode(DEFAULT_AYANAMSA, 0, 0);

    // Calculate ascendant using Swiss Ephemeris
    const flag = swisseph.SEFLG_SIDEREAL;
    const houses = swisseph.swe_houses(
      julianDay,
      latitude,
      longitude,
      DEFAULT_HOUSE_SYSTEM
    );

    if (!houses || typeof houses === 'object' && 'error' in houses) {
      throw new Error(`Failed to calculate houses: ${(houses as any)?.error || 'Houses object is null or invalid'}`);
    }

    const ascendant = normalizeAngle(houses.ascendant);
    
    // Get the sign that the ascendant is in (0-11)
    const ascendantSign = Math.floor(ascendant / 30);
    
    // In Whole Sign system, houses start at 0° of the sign containing the ascendant
    const houseCusps: number[] = [];
    for (let i = 0; i < 12; i++) {
      // Calculate house cusps starting from the ascendant sign
      const signForHouse = (ascendantSign + i) % 12;
      houseCusps.push(signForHouse * 30);
    }

    console.log(`Ascendant: ${ascendant}° (${ZODIAC_SIGNS[ascendantSign]})`);
    console.log('House cusps:', houseCusps.map((cusp, index) => 
      `House ${index + 1}: ${cusp}° (${ZODIAC_SIGNS[Math.floor(cusp / 30)]})`
    ));

    return { ascendant, houseCusps };
  } catch (error) {
    console.error("Error calculating houses:", error);
    throw new Error(`Failed to calculate houses: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
 * Calculate nakshatra details for a given longitude
 */
const getNakshatraInfo = (longitude: number): NakshatraInfo => {
  const normalizedLongitude = normalizeAngle(longitude);
  const nakshatraIndex = Math.floor(normalizedLongitude * 27 / 360);
  const longitudeInNakshatra = normalizedLongitude - (nakshatraIndex * (360/27));
  const pada = Math.floor(longitudeInNakshatra / (360/108)) + 1;
  
  const startDegree = (nakshatraIndex * (360/27));
  const endDegree = ((nakshatraIndex + 1) * (360/27));
  
  return {
    name: NAKSHATRAS[nakshatraIndex],
    lord: NAKSHATRA_LORDS[nakshatraIndex] as DashaPlanet,
    pada,
    startDegree,
    endDegree
  };
};

/**
 * Calculate planetary positions with detailed information
 */
const calculatePlanetaryPositions = (
  julianDay: number,
  birthDetails: BirthDetails
): PlanetaryPositions[] => {
  try {
    const planets: PlanetaryPositions[] = [];
    
    // Set sidereal mode
    swisseph.swe_set_sid_mode(DEFAULT_AYANAMSA, 0, 0);

    // Get ascendant for house calculations
    const { ascendant } = calculateHousesWholeSign(
      julianDay,
      birthDetails.latitude,
      birthDetails.longitude
    );
    const ascendantSign = Math.floor(ascendant / 30);

    // Calculate each planet's position
    for (const [planetName, planetId] of Object.entries(PLANETS)) {
      try {
        const flag = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL;
        let planetData: SwissEphResponse;

        if (planetName === 'KETU') {
          // Get Rahu's position first
          const rahuResult = swisseph.swe_calc_ut(julianDay, PLANETS.RAHU, flag) as SwissEphResponse;
          if ('error' in rahuResult) {
            throw new Error(`Failed to calculate Rahu: ${rahuResult.error}`);
          }
          
          // Calculate Ketu's position (opposite to Rahu)
          const ketuLongitude = normalizeAngle(rahuResult.longitude + 180);
          planetData = {
            longitude: ketuLongitude,
            latitude: -rahuResult.latitude,
            longitudeSpeed: -rahuResult.longitudeSpeed,
            distance: rahuResult.distance,
            latitudeSpeed: -rahuResult.latitudeSpeed,
            distanceSpeed: -rahuResult.distanceSpeed,
            rflag: rahuResult.rflag
          };
        } else if (planetName === 'RAHU') {
          const result = swisseph.swe_calc_ut(julianDay, planetId, flag) as SwissEphResponse;
          if ('error' in result) {
            throw new Error(`Failed to calculate Rahu: ${result.error}`);
          }
          planetData = {
            ...result,
            longitude: normalizeAngle(result.longitude)
          };
        } else {
          const result = swisseph.swe_calc_ut(julianDay, planetId, flag) as SwissEphResponse;
          if ('error' in result) {
            throw new Error(`Failed to calculate ${planetName}: ${result.error}`);
          }
          planetData = result;
        }

        const longitude = normalizeAngle(planetData.longitude);
        
        // Convert longitude to degrees and minutes for more precise display
        const degrees = Math.floor(longitude);
        const minutes = Math.round((longitude - degrees) * 60);
        
        // Adjust if minutes = 60
        const adjustedDegrees = minutes === 60 ? degrees + 1 : degrees;
        const adjustedMinutes = minutes === 60 ? 0 : minutes;
        
        const signIndex = Math.floor(adjustedDegrees / 30);
        const longitudeInSign = adjustedDegrees % 30;
        
        const houseNumber = findHouseWholeSign(longitude, ascendantSign);
        const nakshatraInfo = getNakshatraInfo(longitude);

        const planetInfo: PlanetaryPositions = {
          planet: planetName,
          longitude,
          latitude: planetData.latitude,
          longitudeSpeed: planetData.longitudeSpeed,
          sign: {
            name: ZODIAC_SIGNS[signIndex],
            longitude: longitudeInSign,
            minutes: adjustedMinutes
          },
          nakshatra: nakshatraInfo,
          house: {
            number: houseNumber,
            sign: ZODIAC_SIGNS[(signIndex + houseNumber - 1) % 12]
          },
          isRetrograde: planetData.longitudeSpeed < 0,
          aspectingPlanets: [],
          aspects: []
        };

        planets.push(planetInfo);
      } catch (error) {
        console.error(`Error calculating position for ${planetName}:`, error);
      }
    }

    // Calculate aspects between planets
    for (const planet of planets) {
      const aspects = calculateAspects(planet, planets);
      planet.aspects = aspects.aspects;
      planet.aspectingPlanets = aspects.aspectingPlanets;
    }

    if (planets.length === 0) {
      throw new Error('Failed to calculate positions for any planets');
    }

    return planets;
  } catch (error) {
    console.error("Error in calculatePlanetaryPositions:", error);
    throw new Error(`Failed to calculate planetary positions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Calculate aspects between planets
 */
const calculateAspects = (planet: PlanetaryPositions, allPlanets: PlanetaryPositions[]) => {
  const aspects: { planet: string; aspect: string; orb: number; }[] = [];
  const aspectingPlanets: string[] = [];

  for (const otherPlanet of allPlanets) {
    if (planet.planet === otherPlanet.planet) continue;

    const diff = Math.abs(normalizeAngle(planet.longitude - otherPlanet.longitude));
    
    // Define aspects and their orbs
    const aspectDefs = [
      { angle: 0, name: 'Conjunction', maxOrb: 8 },
      { angle: 60, name: 'Sextile', maxOrb: 6 },
      { angle: 90, name: 'Square', maxOrb: 7 },
      { angle: 120, name: 'Trine', maxOrb: 8 },
      { angle: 180, name: 'Opposition', maxOrb: 8 }
    ];

    for (const aspectDef of aspectDefs) {
      const orb = Math.abs(diff - aspectDef.angle);
      if (orb <= aspectDef.maxOrb) {
        aspects.push({
          planet: otherPlanet.planet,
          aspect: aspectDef.name,
          orb
        });
        aspectingPlanets.push(otherPlanet.planet);
        break;
      }
    }
  }

  return { aspects, aspectingPlanets };
};

/**
 * Calculate elapsed and remaining time
 */
const calculateTimeSpan = (startDate: Date, endDate: Date, referenceDate: Date = new Date()): {
  elapsed: { years: number; months: number; days: number; };
  remaining: { years: number; months: number; days: number; };
} => {
  const msPerDay = 24 * 60 * 60 * 1000;
  
  // Calculate elapsed time
  const elapsedMs = referenceDate.getTime() - startDate.getTime();
  const elapsedDays = Math.floor(elapsedMs / msPerDay);
  const elapsedYears = Math.floor(elapsedDays / 365.25);
  const remainingDays = elapsedDays % 365.25;
  const elapsedMonths = Math.floor(remainingDays / 30.44);
  const finalElapsedDays = Math.floor(remainingDays % 30.44);

  // Calculate remaining time
  const remainingMs = endDate.getTime() - referenceDate.getTime();
  const remainingTotalDays = Math.floor(remainingMs / msPerDay);
  const remainingYears = Math.floor(remainingTotalDays / 365.25);
  const daysAfterYears = remainingTotalDays % 365.25;
  const remainingMonths = Math.floor(daysAfterYears / 30.44);
  const finalRemainingDays = Math.floor(daysAfterYears % 30.44);

  return {
    elapsed: {
      years: elapsedYears,
      months: elapsedMonths,
      days: finalElapsedDays
    },
    remaining: {
      years: remainingYears,
      months: remainingMonths,
      days: finalRemainingDays
    }
  };
};

/**
 * Calculate Vimshottari Dasha periods
 */
const calculateDashas = (julianDay: number, moonLongitude: number): DashaInfo => {
  try {
    // Normalize Moon's longitude
    const normalizedMoonLongitude = normalizeAngle(moonLongitude);
    
    // Calculate Moon's nakshatra position (0-26)
    const nakshatraIndex = Math.floor(normalizedMoonLongitude * 27 / 360);
    const nakshatraProgress = (normalizedMoonLongitude * 27 / 360) - nakshatraIndex;
    
    // Get birth nakshatra lord
    const birthNakshatraLord = NAKSHATRA_LORDS[nakshatraIndex] as DashaPlanet;
    if (!birthNakshatraLord) {
      throw new Error(`Invalid nakshatra index: ${nakshatraIndex}`);
    }
    
    // Calculate remaining dasha years
    const lordPeriod = DASHA_PERIODS[birthNakshatraLord];
    if (typeof lordPeriod !== 'number') {
      throw new Error(`No dasha period defined for lord: ${birthNakshatraLord}`);
    }
    
    const remainingYears = lordPeriod * (1 - nakshatraProgress);
    
    // Calculate birth date from Julian Day
    const birthDate = new Date((julianDay - 2440587.5) * 86400000);
    let currentDate = new Date(birthDate);
    
    // Calculate current dasha end date
    const currentDashaEndDate = new Date(currentDate.getTime() + remainingYears * 365.25 * 24 * 60 * 60 * 1000);
    
    // Calculate time spans
    const timeSpans = calculateTimeSpan(currentDate, currentDashaEndDate);
    
    // Calculate dasha sequence
    const sequence: DashaDetail[] = [];
    
    // Add current dasha
    sequence.push({
      planet: birthNakshatraLord,
      startDate: new Date(currentDate),
      endDate: new Date(currentDashaEndDate)
    });
    
    // Add subsequent dashas
    let currentLordIndex = NAKSHATRA_LORDS.indexOf(birthNakshatraLord);
    for (let i = 1; i < 9; i++) {
      currentLordIndex = (currentLordIndex + 1) % NAKSHATRA_LORDS.length;
      const planet = NAKSHATRA_LORDS[currentLordIndex] as DashaPlanet;
      const periodYears = DASHA_PERIODS[planet];
      
      if (typeof periodYears !== 'number') {
        console.error(`No dasha period defined for planet: ${planet}, skipping`);
        continue;
      }
      
      const startDate = new Date(sequence[i-1].endDate);
      const endDate = new Date(startDate.getTime() + periodYears * 365.25 * 24 * 60 * 60 * 1000);
      
      sequence.push({
        planet,
        startDate,
        endDate
      });
    }
    
    // Validate sequence
    if (sequence.length === 0) {
      throw new Error('No dasha periods calculated');
    }
    
    return {
      current: {
        planet: birthNakshatraLord,
        startDate: currentDate,
        endDate: currentDashaEndDate,
        elapsed: timeSpans.elapsed,
        remaining: timeSpans.remaining
      },
      sequence
    };
  } catch (error) {
    console.error("Error calculating dashas:", error);
    throw new Error(`Failed to calculate dashas: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Main function to fetch chart data
 */
export const fetchChartData = async (birthDetails: BirthDetails): Promise<ChartData> => {
  try {
    logAstrologyCalculation('Start', birthDetails, null);
    
    const julianDay = getJulianDay(birthDetails);
    logAstrologyCalculation('Julian Day', birthDetails, julianDay);
    
    const ayanamsa = swisseph.swe_get_ayanamsa_ut(julianDay);
    logAstrologyCalculation('Ayanamsa', julianDay, ayanamsa);

    // Calculate ascendant and houses
    const { ascendant, houseCusps } = calculateHousesWholeSign(
      julianDay, 
      birthDetails.latitude, 
      birthDetails.longitude
    );
    logAstrologyCalculation('Houses', { julianDay, birthDetails }, { ascendant, houseCusps });

    // Calculate planetary positions
    const planets = calculatePlanetaryPositions(julianDay, birthDetails);
    logAstrologyCalculation('Planets', { julianDay, birthDetails }, planets);

    // Calculate houses with planets
    const houses = houseCusps.map((cusp, index) => {
      const planetsInHouse = planets
        .filter(p => p.house.number === index + 1)
        .map(p => p.planet);

      return {
        number: index + 1,
        sign: ZODIAC_SIGNS[Math.floor(cusp / 30)],
        degree: cusp % 30,
        planets: planetsInHouse
      };
    });

    // Find Moon for dasha calculations
    const moon = planets.find(p => p.planet === 'MOON');
    if (!moon) {
      throw new Error('Moon position not found');
    }

    // Calculate dashas
    const dashas = calculateDashas(julianDay, moon.longitude);
    logAstrologyCalculation('Dashas', { julianDay, moonLongitude: moon.longitude }, dashas);

    const chartData: ChartData = {
      metadata: {
        date: birthDetails.date,
        time: birthDetails.time,
        timezone: birthDetails.timezone,
        latitude: birthDetails.latitude,
        longitude: birthDetails.longitude,
        ayanamsa,
        houseSystem: DEFAULT_HOUSE_SYSTEM
      },
      ascendant: {
        longitude: ascendant,
        sign: {
          name: ZODIAC_SIGNS[Math.floor(ascendant / 30)],
          degree: ascendant % 30
        },
        nakshatra: getNakshatraInfo(ascendant)
      },
      planets,
      houses,
      dashas
    };

    logAstrologyCalculation('Complete', birthDetails, chartData);
    return chartData;
  } catch (error) {
    logAstrologyCalculation('Error', birthDetails, null, error);
    throw error;
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
export const fetchNakshatra = async (birthDetails: BirthDetails, planetName: string): Promise<NakshatraResponse> => {
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
      nakshatra: planet.nakshatra.name,
      nakshatraLord: planet.nakshatra.lord
    };
  } catch (error: any) {
    console.error(`Error fetching nakshatra for ${planetName}:`, error);
    throw new Error(`Failed to fetch nakshatra: ${error?.message || 'Unknown error'}`);
  }
};
