import swisseph from 'swisseph';
import { BirthDetails, ChartData, PlanetaryPosition } from "@/types/astrology";

// Cấu hình Swiss Ephemeris - chỉ định đường dẫn tương đối
// Trong môi trường trình duyệt, đường dẫn tương đối sẽ được sử dụng
const EPHE_PATH = './ephe';
swisseph.swe_set_ephe_path(EPHE_PATH);

// Các hằng số cho các hành tinh
const SUN = swisseph.SE_SUN;
const MOON = swisseph.SE_MOON;
const MERCURY = swisseph.SE_MERCURY;
const VENUS = swisseph.SE_VENUS;
const MARS = swisseph.SE_MARS;
const JUPITER = swisseph.SE_JUPITER;
const SATURN = swisseph.SE_SATURN;
const RAHU = swisseph.SE_MEAN_NODE; // Rahu (North Node)
const KETU = -1; // Ketu (South Node) - sẽ tính sau dựa trên Rahu

// Ayanamsha (sự chênh lệch giữa Tropical và Sidereal)
const AYANAMSA = swisseph.SE_SIDM_LAHIRI; // Sử dụng Lahiri Ayanamsha cho Vedic Astrology

// Chuyển đổi ngày tháng thành Julian Day cho Swiss Ephemeris
const getJulianDay = (birthDetails: BirthDetails): number => {
  const date = new Date(birthDetails.date + 'T' + birthDetails.time);
  
  // Trích xuất thành phần ngày tháng
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours() + date.getMinutes() / 60.0 + date.getSeconds() / 3600.0;
  
  // Lấy UT (Universal Time) sau khi điều chỉnh múi giờ
  const timezone = parseFloat(birthDetails.timezone) || 0;
  const ut = hour - timezone;
  
  // Sử dụng API Swiss Ephemeris để tính Julian Day
  return swisseph.swe_julday(year, month, day, ut, swisseph.SE_GREG_CAL);
};

// Xử lý lỗi trong API và trả về kết quả an toàn
const safeGetPlanetPosition = (julianDay: number, planet: number, flag: number) => {
  try {
    return swisseph.swe_calc_ut(julianDay, planet, flag);
  } catch (error) {
    console.error(`Error calculating planet ${planet} position:`, error);
    return { 
      longitude: 0, 
      latitude: 0, 
      longitudeSpeed: 0,
      error: `Failed to calculate position for planet ${planet}`
    };
  }
};

// Lấy vị trí hành tinh
const getPlanetPosition = (
  julianDay: number, 
  planet: number, 
  flag: number = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_SPEED
): { longitude: number, latitude: number, speed: number } => {
  // Đặt Ayanamsha cho tính toán sidereal
  try {
    swisseph.swe_set_sid_mode(AYANAMSA, 0, 0);
  } catch (error) {
    console.error("Error setting sidereal mode:", error);
  }
  
  let result;
  
  try {
    if (planet === RAHU) {
      result = safeGetPlanetPosition(julianDay, planet, flag);
      return {
        longitude: result.longitude || 0,
        latitude: result.latitude || 0,
        speed: result.longitudeSpeed || 0
      };
    } else if (planet === KETU) {
      // Ketu luôn đối diện với Rahu (cách 180 độ)
      result = safeGetPlanetPosition(julianDay, RAHU, flag);
      return {
        longitude: ((result.longitude || 0) + 180) % 360,
        latitude: -(result.latitude || 0),
        speed: result.longitudeSpeed || 0
      };
    } else {
      result = safeGetPlanetPosition(julianDay, planet, flag);
      return {
        longitude: result.longitude || 0,
        latitude: result.latitude || 0,
        speed: result.longitudeSpeed || 0
      };
    }
  } catch (error) {
    console.error(`Error in getPlanetPosition for planet ${planet}:`, error);
    return { longitude: 0, latitude: 0, speed: 0 };
  }
};

// Chuyển đổi độ sang cung hoàng đạo
const getZodiacSign = (longitude: number): string => {
  const signs = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  const signIndex = Math.floor(longitude / 30) % 12;
  return signs[signIndex];
};

// Chuyển đổi độ sang Nakshatra
const getNakshatra = (longitude: number): string => {
  const nakshatras = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira",
    "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha",
    "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati",
    "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
    "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
  ];
  const nakshatraIndex = Math.floor(longitude * 27 / 360) % 27;
  return nakshatras[nakshatraIndex];
};

// Tính ngôi nhà chiêm tinh (sử dụng hệ thống Equal House)
const getHousePosition = (ascendantDegree: number, planetLongitude: number): number => {
  // Tính chênh lệch giữa vị trí hành tinh và cung mọc
  let diff = planetLongitude - ascendantDegree;
  if (diff < 0) diff += 360;
  
  // Chia cho 30 (mỗi cung 30 độ trong hệ thống Equal House)
  // và cộng 1 vì nhà 1 bắt đầu từ cung mọc
  return Math.floor(diff / 30) + 1;
};

// Type definition for house calculation result
type HouseCalcResult = {
  house?: any[];
  ascendant?: number;
  mc?: number;
  armc?: number;
  vertex?: number;
  equatorialAscendant?: number;
  kochCoAscendant?: number;
  munkaseyCoAscendant?: number;
  munkaseyPolarAscendant?: number;
  error?: string;
};

// Tính toán cung mọc một cách an toàn - Sửa tham số system thành string
const safeCalculateHouses = (julianDay: number, flags: number, latitude: number, longitude: number, system: string): HouseCalcResult => {
  try {
    return swisseph.swe_houses(julianDay, flags, latitude, longitude, system);
  } catch (error) {
    console.error("Error calculating houses:", error);
    return {
      error: "Error calculating houses",
    };
  }
};

// Lấy vị trí cung mọc (Ascendant)
const calculateAscendant = (birthDetails: BirthDetails): { sign: string, degree: number, nakshatra: string } => {
  try {
    const julianDay = getJulianDay(birthDetails);
    
    // Flags cho Swiss Ephemeris
    const flags = swisseph.SEFLG_SIDEREAL;
    
    // Đặt chế độ Sidereal (Veda)
    swisseph.swe_set_sid_mode(AYANAMSA, 0, 0);
    
    // Tính vị trí cung mọc (Ascendant)
    const geoPos = {
      longitude: birthDetails.longitude,
      latitude: birthDetails.latitude,
      altitude: 0 // Mặc định là 0 mét trên mực nước biển
    };
    
    // Đảm bảo sử dụng "E" dạng string cho system
    const result = safeCalculateHouses(julianDay, flags, geoPos.latitude, geoPos.longitude, "E");
    
    if (result.error) {
      return {
        sign: "Unknown",
        degree: 0,
        nakshatra: "Unknown"
      };
    }
    
    // Lấy độ của cung mọc
    const ascendantDegree = result.ascendant || 0;
    
    return {
      sign: getZodiacSign(ascendantDegree),
      degree: ascendantDegree % 30, // Độ trong cung
      nakshatra: getNakshatra(ascendantDegree)
    };
  } catch (error) {
    console.error("Error in calculateAscendant:", error);
    return {
      sign: "Unknown",
      degree: 0,
      nakshatra: "Unknown"
    };
  }
};

// Tính toán các hành tinh
const calculatePlanetaryPositions = (birthDetails: BirthDetails): PlanetaryPosition[] => {
  try {
    const julianDay = getJulianDay(birthDetails);
    const ascendantInfo = calculateAscendant(birthDetails);
    
    // Convert sign name to index and calculate absolute degree
    const signs = [
      "Aries", "Taurus", "Gemini", "Cancer",
      "Leo", "Virgo", "Libra", "Scorpio",
      "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ];
    
    const signIndex = signs.indexOf(ascendantInfo.sign);
    const ascendantDegree = (signIndex !== -1 ? signIndex * 30 : 0) + ascendantInfo.degree;
    
    // Danh sách các hành tinh cần tính
    const planets = [
      { id: SUN, name: "Sun" },
      { id: MOON, name: "Moon" },
      { id: MERCURY, name: "Mercury" },
      { id: VENUS, name: "Venus" },
      { id: MARS, name: "Mars" },
      { id: JUPITER, name: "Jupiter" },
      { id: SATURN, name: "Saturn" },
      { id: RAHU, name: "Rahu" },
      { id: KETU, name: "Ketu" }
    ];
    
    // Tính vị trí của từng hành tinh
    return planets.map(planet => {
      const position = getPlanetPosition(julianDay, planet.id);
      const house = getHousePosition(ascendantDegree, position.longitude);
      
      return {
        planet: planet.name,
        longitude: position.longitude,
        latitude: position.latitude,
        house: house,
        sign: getZodiacSign(position.longitude),
        nakshatra: getNakshatra(position.longitude),
        retrograde: position.speed < 0
      };
    });
  } catch (error) {
    console.error("Error in calculatePlanetaryPositions:", error);
    return [];
  }
};

// Tính toán các ngôi nhà
const calculateHouses = (birthDetails: BirthDetails): { house: number, sign: string, degree: number }[] => {
  try {
    const julianDay = getJulianDay(birthDetails);
    
    // Flags cho Swiss Ephemeris
    const flags = swisseph.SEFLG_SIDEREAL;
    
    // Đặt chế độ Sidereal (Veda)
    swisseph.swe_set_sid_mode(AYANAMSA, 0, 0);
    
    // Tính vị trí các ngôi nhà
    const geoPos = {
      longitude: birthDetails.longitude,
      latitude: birthDetails.latitude,
      altitude: 0
    };
    
    // Đảm bảo sử dụng "E" dạng string cho system
    const houseSystem = "E"; // Equal House system
    const result = safeCalculateHouses(julianDay, flags, geoPos.latitude, geoPos.longitude, houseSystem);
    
    // Check if there was an error calculating houses
    if (result.error) {
      return Array(12).fill(0).map((_, i) => ({
        house: i + 1,
        sign: "Unknown",
        degree: 0
      }));
    }
    
    // Tạo mảng chứa thông tin các ngôi nhà
    const houses = [];
    
    // Make sure house array exists before accessing it
    const houseArray = result.house || [];
    
    for (let i = 0; i < 12; i++) {
      const houseCusp = i < houseArray.length ? houseArray[i] || 0 : 0;
      houses.push({
        house: i + 1,
        sign: getZodiacSign(houseCusp),
        degree: houseCusp % 30
      });
    }
    
    return houses;
  } catch (error) {
    console.error("Error in calculateHouses:", error);
    return Array(12).fill(0).map((_, i) => ({
      house: i + 1,
      sign: "Unknown",
      degree: 0
    }));
  }
};

// Tính toán Vimshottari Dasha (hệ thống chu kỳ 120 năm của Veda)
const calculateDashas = (birthDetails: BirthDetails): { current: string, endDate: string, subDashas?: { current: string, endDate: string }[] } => {
  try {
    const julianDay = getJulianDay(birthDetails);
    
    // Tính vị trí Mặt Trăng để xác định Dasha
    const moonPosition = getPlanetPosition(julianDay, MOON);
    const moonLongitude = moonPosition.longitude;
    
    // Tính Nakshatra của Mặt Trăng
    const nakshatraIndex = Math.floor(moonLongitude * 27 / 360) % 27;
    
    // Danh sách các hành tinh theo thứ tự Dasha
    const dashaPlanets = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
    
    // Thời gian của mỗi Dasha theo năm
    const dashaDurations = [7, 20, 6, 10, 7, 18, 16, 19, 17];
    
    // Tính toán vị trí hiện tại trong chu kỳ Dasha
    // Đây là phần giả lập đơn giản, trong thực tế cần tính toán phức tạp hơn
    const birthDate = new Date(birthDetails.date);
    const today = new Date();
    const yearsSinceBirth = (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    // Tính toán chu kỳ Dasha hiện tại
    let currentDashaIndex = -1;
    let currentDasha = "";
    let dashaEndDate = "";
    let accumulatedYears = 0;
    
    for (let i = 0; i < dashaPlanets.length; i++) {
      const startingIndex = (nakshatraIndex + i) % 9;
      accumulatedYears += dashaDurations[startingIndex];
      
      if (yearsSinceBirth < accumulatedYears) {
        currentDashaIndex = startingIndex;
        currentDasha = dashaPlanets[startingIndex];
        
        // Tính ngày kết thúc
        const endYear = birthDate.getFullYear() + Math.floor(accumulatedYears);
        const endMonth = birthDate.getMonth();
        const endDay = birthDate.getDate();
        dashaEndDate = `${endYear}-${(endMonth + 1).toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`;
        break;
      }
    }
    
    // Tính Sub-Dasha (đơn giản hoá)
    const subDashas = dashaPlanets.map((planet, index) => {
      const subDuration = dashaDurations[index] * dashaDurations[currentDashaIndex !== -1 ? currentDashaIndex : 0] / 120;
      const subEndYear = birthDate.getFullYear() + Math.floor(yearsSinceBirth + subDuration);
      const subEndMonth = birthDate.getMonth();
      const subEndDay = birthDate.getDate();
      
      return {
        current: planet,
        endDate: `${subEndYear}-${(subEndMonth + 1).toString().padStart(2, '0')}-${subEndDay.toString().padStart(2, '0')}`
      };
    });
    
    return {
      current: currentDasha || "Unknown",
      endDate: dashaEndDate || "Unknown",
      subDashas: subDashas.slice(0, 3) // Chỉ lấy 3 sub-dasha đầu tiên
    };
  } catch (error) {
    console.error("Error in calculateDashas:", error);
    return {
      current: "Unknown",
      endDate: "Unknown",
      subDashas: []
    };
  }
};

// Tạo API endpoint để lấy dữ liệu biểu đồ
export const fetchChartData = async (birthDetails: BirthDetails): Promise<ChartData> => {
  console.log("Fetching chart data with details:", birthDetails);
  try {
    const ascendant = calculateAscendant(birthDetails);
    console.log("Calculated ascendant:", ascendant);
    
    const planets = calculatePlanetaryPositions(birthDetails);
    console.log("Calculated planets:", planets);
    
    const houses = calculateHouses(birthDetails);
    console.log("Calculated houses:", houses);
    
    const dashas = calculateDashas(birthDetails);
    console.log("Calculated dashas:", dashas);
    
    return {
      ascendant,
      planets,
      houses,
      dashas
    };
  } catch (error) {
    console.error('Error calculating chart data:', error);
    throw error;
  }
};

// API endpoints riêng lẻ cho từng thành phần dữ liệu
export const fetchPlanetaryPositions = async (birthDetails: BirthDetails) => {
  try {
    return calculatePlanetaryPositions(birthDetails);
  } catch (error) {
    console.error('Error calculating planetary positions:', error);
    throw error;
  }
};

export const fetchAscendant = async (birthDetails: BirthDetails) => {
  try {
    return calculateAscendant(birthDetails);
  } catch (error) {
    console.error('Error calculating ascendant:', error);
    throw error;
  }
};

export const fetchDashas = async (birthDetails: BirthDetails) => {
  try {
    return calculateDashas(birthDetails);
  } catch (error) {
    console.error('Error calculating dashas:', error);
    throw error;
  }
};
