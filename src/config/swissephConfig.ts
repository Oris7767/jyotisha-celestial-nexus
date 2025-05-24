import swisseph from 'swisseph';
import path from 'path';

// Initialize Swiss Ephemeris
try {
  // Set ephemeris path
  const ephePath = process.env.EPHE_PATH || path.resolve(process.cwd(), 'ephe');
  swisseph.swe_set_ephe_path(ephePath);
  
  // Set Ayanamsa to Lahiri
  swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
  console.log('Swiss Ephemeris initialized successfully with Lahiri Ayanamsa');
} catch (error) {
  console.error('Error initializing Swiss Ephemeris:', error);
  throw new Error('Failed to initialize Swiss Ephemeris');
}

// Define available ayanamsa options
export const AYANAMSA = {
  FAGAN_BRADLEY: swisseph.SE_SIDM_FAGAN_BRADLEY,
  LAHIRI: swisseph.SE_SIDM_LAHIRI,
  KRISHNAMURTI: swisseph.SE_SIDM_KRISHNAMURTI,
  RAMAN: swisseph.SE_SIDM_RAMAN
};

// Set default ayanamsa
export const DEFAULT_AYANAMSA = AYANAMSA.LAHIRI;

// Calendar type
export const GREGORIAN_CALENDAR = swisseph.SE_GREG_CAL;

// House systems
export const HOUSE_SYSTEMS = {
  PLACIDUS: 'P',
  KOCH: 'K',
  PORPHYRIUS: 'O',
  REGIOMONTANUS: 'R',
  CAMPANUS: 'C',
  EQUAL: 'E',
  WHOLE_SIGN: 'W'
};

// Default house system
export const DEFAULT_HOUSE_SYSTEM = HOUSE_SYSTEMS.WHOLE_SIGN;

// Zodiac signs
export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// Nakshatras
export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini',
  'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya',
  'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha',
  'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

// Nakshatra Lords
export const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon',
  'Mars', 'Rahu', 'Jupiter', 'Saturn',
  'Mercury', 'Ketu', 'Venus', 'Sun',
  'Moon', 'Mars', 'Rahu', 'Jupiter',
  'Saturn', 'Mercury', 'Ketu', 'Venus',
  'Sun', 'Moon', 'Mars', 'Rahu',
  'Jupiter', 'Saturn', 'Mercury'
];

// Planets
export const PLANETS = {
  SUN: swisseph.SE_SUN,
  MOON: swisseph.SE_MOON,
  MARS: swisseph.SE_MARS,
  MERCURY: swisseph.SE_MERCURY,
  JUPITER: swisseph.SE_JUPITER,
  VENUS: swisseph.SE_VENUS,
  SATURN: swisseph.SE_SATURN,
  RAHU: swisseph.SE_MEAN_NODE,  // Changed from SE_TRUE_NODE to SE_MEAN_NODE
  KETU: -1  // South Node (will be calculated as Rahu + 180°)
};

export type DashaPlanet = 'Ketu' | 'Venus' | 'Sun' | 'Moon' | 'Mars' | 'Rahu' | 'Jupiter' | 'Saturn' | 'Mercury';

export const DASHA_PERIODS: Record<DashaPlanet, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17
};

// Export swisseph as default
export default swisseph;
