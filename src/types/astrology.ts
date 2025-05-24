export interface PlanetaryPositions {
  planet: string;
  longitude: number;
  latitude: number;
  sign: string;
  nakshatra: string;
  house: number;
  retrograde: boolean;
}

export interface HousePosition {
  house: number;
  sign: string;
  degree: number;
}

export interface Ascendant {
  sign: string;
  degree: number;
  nakshatra?: string;
}

export interface DashaDetail {
  planet: string;
  endDate: Date;
}

export interface Dasha {
  current: string;
  sequence: DashaDetail[];
}

export interface ChartData {
  ascendant: {
    sign: string;
    degree: number;
    nakshatra: string;
  };
  planets: PlanetaryPositions[];
  houses: {
    house: number;
    sign: string;
    degree: number;
  }[];
  dashas: {
    current: string;
    sequence: {
      planet: string;
      endDate: Date;
    }[];
  };
}

export interface BirthDetails {
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  timezone: string;
}
