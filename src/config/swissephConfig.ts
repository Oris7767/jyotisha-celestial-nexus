
import swisseph from 'swisseph';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Ephemeris file path with fallbacks
const determineEphePath = () => {
  const envPath = process.env.EPHE_PATH;
  
  if (envPath) {
    console.log(`Using environment-specified ephemeris path: ${envPath}`);
    return envPath;
  }
  
  const defaultPath = path.resolve(__dirname, '../../ephe');
  console.log(`Using default ephemeris path: ${defaultPath}`);

  // Check if directory exists
  if (!fs.existsSync(defaultPath)) {
    console.warn(`Warning: Ephemeris directory does not exist at ${defaultPath}`);
    try {
      fs.mkdirSync(defaultPath, { recursive: true });
      console.log(`Created ephemeris directory at ${defaultPath}`);
    } catch (err) {
      console.error(`Error creating ephemeris directory: ${err}`);
    }
  }

  return defaultPath;
};

const EPHE_PATH = determineEphePath();

// Initialize Swiss Ephemeris with the ephemeris path
try {
  swisseph.swe_set_ephe_path(EPHE_PATH);
  
  // Set Ayanamsa to Lahiri (Indian/Hindu ayanamsa)
  // Corrected: Changed SIDM_LAHIRI to SE_SIDM_LAHIRI
  swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
  console.log('Swiss Ephemeris initialized successfully with Lahiri Ayanamsa');
} catch (error) {
  console.error('Error initializing Swiss Ephemeris:', error);
}

// Zodiac constants
export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 
  'Leo', 'Virgo', 'Libra', 'Scorpio', 
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Nakshatra constants
export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

// Planet constants
export const PLANETS = {
  SUN: swisseph.SE_SUN,
  MOON: swisseph.SE_MOON,
  MARS: swisseph.SE_MARS,
  MERCURY: swisseph.SE_MERCURY,
  JUPITER: swisseph.SE_JUPITER,
  VENUS: swisseph.SE_VENUS,
  SATURN: swisseph.SE_SATURN,
  RAHU: swisseph.SE_TRUE_NODE, // North Node
  KETU: swisseph.SE_TRUE_NODE + 1, // Placeholder for South Node (calculated from Rahu)
};

// Dasha periods in years
export const DASHA_PERIODS = {
  SUN: 6,
  MOON: 10,
  MARS: 7,
  RAHU: 18,
  JUPITER: 16,
  SATURN: 19,
  MERCURY: 17,
  KETU: 7,
  VENUS: 20
};

// Nakshatra lords (dasha sequence)
export const NAKSHATRA_LORDS = [
  'KETU', 'VENUS', 'SUN', 'MOON', 'MARS', 'RAHU', 'JUPITER', 'SATURN', 'MERCURY',
  'KETU', 'VENUS', 'SUN', 'MOON', 'MARS', 'RAHU', 'JUPITER', 'SATURN', 'MERCURY',
  'KETU', 'VENUS', 'SUN', 'MOON', 'MARS', 'RAHU', 'JUPITER', 'SATURN', 'MERCURY'
];

// House system constants
export const HOUSE_SYSTEMS = {
  PLACIDUS: 'P',
  KOCH: 'K',
  EQUAL: 'E',
  WHOLE_SIGN: 'W',
  SRIPATI: 'S'
};

// Default house system (changed to Whole Sign as per Vedic tradition)
export const DEFAULT_HOUSE_SYSTEM = HOUSE_SYSTEMS.WHOLE_SIGN;

// Ayanamsa types - Corrected to use SE_ prefix
export const AYANAMSA_TYPES = {
  LAHIRI: swisseph.SE_SIDM_LAHIRI,
  RAMAN: swisseph.SE_SIDM_RAMAN,
  KRISHNAMURTI: swisseph.SE_SIDM_KRISHNAMURTI
};

// Default ayanamsa
export const DEFAULT_AYANAMSA = AYANAMSA_TYPES.LAHIRI;

// Calendar type
export const GREGORIAN_CALENDAR = swisseph.SE_GREG_CAL;

// Export Swiss Ephemeris library for use in other files
export default swisseph;
