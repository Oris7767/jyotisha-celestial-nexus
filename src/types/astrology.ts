
export interface PlanetaryPosition {
  planet: string;
  longitude: number;
  latitude?: number;
  house: number;
  sign: string;
  nakshatra?: string;
  retrograde: boolean;
}

export interface ChartData {
  ascendant: {
    sign: string;
    degree: number;
    nakshatra?: string;
  };
  planets: PlanetaryPosition[];
  houses: {
    house: number;
    sign: string;
    degree: number;
  }[];
  dashas?: {
    current: string;
    endDate: string;
    subDashas?: {
      current: string;
      endDate: string;
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
