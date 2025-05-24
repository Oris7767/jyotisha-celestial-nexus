declare module 'swisseph' {
  export const SE_SUN: number;
  export const SE_MOON: number;
  export const SE_MARS: number;
  export const SE_MERCURY: number;
  export const SE_JUPITER: number;
  export const SE_VENUS: number;
  export const SE_SATURN: number;
  export const SE_TRUE_NODE: number;
  
  export const SE_SIDM_FAGAN_BRADLEY: number;
  export const SE_SIDM_LAHIRI: number;
  export const SE_SIDM_LAHIRI_ICRC: number;
  export const SE_SIDM_KRISHNAMURTI: number;
  export const SE_SIDM_RAMAN: number;
  
  export const SE_GREG_CAL: number;
  export const SEFLG_SIDEREAL: number;
  
  export function swe_set_ephe_path(path: string): void;
  export function swe_set_sid_mode(mode: number, t0: number, ayan_t0: number): void;
  export function swe_utc_to_jd(year: number, month: number, day: number, hour: number, min: number, sec: number, gregflag: number, dret: number[], serr: string | null): number;
  export function swe_calc_ut(tjd_ut: number, ipl: number, iflag: number): { longitude: number; latitude: number; longitudeSpeed: number; rflag: number; };
  export function swe_houses(tjd_ut: number, lat: number, lon: number, hsys: string): { ascendant: number; mc: number; armc: number; vertex: number; equatorialAscendant: number; coAscendant1: number; coAscendant2: number; polarAscendant: number; houses: number[]; };
  
  export default {
    SE_SUN,
    SE_MOON,
    SE_MARS,
    SE_MERCURY,
    SE_JUPITER,
    SE_VENUS,
    SE_SATURN,
    SE_TRUE_NODE,
    SE_SIDM_FAGAN_BRADLEY,
    SE_SIDM_LAHIRI,
    SE_SIDM_LAHIRI_ICRC,
    SE_SIDM_KRISHNAMURTI,
    SE_SIDM_RAMAN,
    SE_GREG_CAL,
    SEFLG_SIDEREAL,
    swe_set_ephe_path,
    swe_set_sid_mode,
    swe_utc_to_jd,
    swe_calc_ut,
    swe_houses
  };
} 