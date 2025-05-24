import { DashaPlanet } from '../config/swissephConfig.js';

export interface NakshatraInfo {
  name: string;
  lord: DashaPlanet;
  pada: number;
  startDegree: number;
  endDegree: number;
}

export interface PlanetaryPositions {
  planet: string;
  longitude: number;
  latitude: number;
  longitudeSpeed: number;
  sign: {
    name: string;
    longitude: number; // 0-30 degrees within sign
  };
  nakshatra: NakshatraInfo;
  house: {
    number: number;
    sign: string;
  };
  isRetrograde: boolean;
  aspectingPlanets?: string[]; // Planets aspecting this planet
  aspects?: {
    planet: string;
    aspect: string; // e.g., "Conjunction", "Opposition", etc.
    orb: number;
  }[];
}

export interface HousePosition {
  number: number;
  sign: string;
  degree: number;
  planets: string[]; // Planets in this house
}

export interface Ascendant {
  longitude: number;
  sign: {
    name: string;
    degree: number; // 0-30 degrees within sign
  };
  nakshatra: NakshatraInfo;
}

export interface DashaDetail {
  planet: DashaPlanet;
  startDate: Date;
  endDate: Date;
  subDashas?: DashaDetail[]; // For antardasha/bhukti
}

export interface DashaInfo {
  current: {
    planet: DashaPlanet;
    startDate: Date;
    endDate: Date;
    elapsed: {
      years: number;
      months: number;
      days: number;
    };
    remaining: {
      years: number;
      months: number;
      days: number;
    };
  };
  sequence: DashaDetail[];
}

export interface ChartData {
  metadata: {
    date: string;
    time: string;
    timezone: string;
    latitude: number;
    longitude: number;
    ayanamsa: number;
    houseSystem: string;
  };
  ascendant: Ascendant;
  planets: PlanetaryPositions[];
  houses: HousePosition[];
  dashas: DashaInfo;
}

export interface BirthDetails {
  date: string;
  time: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

export interface SwissEphResponse {
  longitude: number;
  latitude: number;
  distance: number;
  longitudeSpeed: number;
  latitudeSpeed: number;
  distanceSpeed: number;
  rflag: number;
}

export interface NakshatraResponse {
  planet: string;
  nakshatra: string;
  nakshatraLord: DashaPlanet;
}
