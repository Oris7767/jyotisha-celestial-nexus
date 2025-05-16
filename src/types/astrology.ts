
export interface PlanetaryPosition {
  planet: string;
  longitude: number;
  latitude?: number;
  house: number;
  sign: string;
  nakshatra?: string;
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
  ascendant: Ascendant;
  planets: PlanetaryPosition[];
  houses: HousePosition[];
  dashas?: Dasha;
}

export interface BirthDetails {
  date: string;     // Format: YYYY-MM-DD
  time: string;     // Format: HH:MM (24-hour)
  latitude: number; // Decimal degrees (positive for North, negative for South)
  longitude: number; // Decimal degrees (positive for East, negative for West)
  timezone: string; // Format: UTC+/-HH:MM or time zone name
}
