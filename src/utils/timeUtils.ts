import moment from 'moment-timezone';
import { BirthDetails } from '../types/astrology.js';

interface UTCDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/**
 * Convert local time to UTC
 * Handles timezone conversion with proper handling of day boundary cases
 */
export const convertToUTC = (birthDetails: BirthDetails): UTCDateTime => {
  const { date, time, timezone } = birthDetails;

  // Convert date and time to moment object in the specified timezone
  const datetime = moment.tz(`${date} ${time}`, "YYYY-MM-DD HH:mm", timezone);
  if (!datetime.isValid()) {
    throw new Error('Invalid date/time format');
  }

  // Get UTC date components
  const utcDateTime = {
    year: datetime.utc().year(),
    month: datetime.utc().month() + 1, // moment months are 0-based
    day: datetime.utc().date(),
    hour: datetime.utc().hour(),
    minute: datetime.utc().minute()
  };

  // Log conversion details for debugging
  console.log('Time conversion details:', {
    input: {
      date,
      time,
      timezone,
      originalDateTime: datetime.format(),
    },
    output: {
      utc: utcDateTime,
      utcString: datetime.utc().format()
    }
  });

  return utcDateTime;
};

/**
 * Validate timezone string
 * Returns true if timezone is valid, false otherwise
 */
export const isValidTimezone = (timezone: string): boolean => {
  return moment.tz.zone(timezone) !== null;
};

/**
 * Get timezone offset in hours
 * Returns offset in decimal hours (e.g., 5.5 for UTC+5:30)
 */
export const getTimezoneOffset = (timezone: string): number => {
  const now = moment().tz(timezone);
  return now.utcOffset() / 60;
};

/**
 * Format UTC time components as ISO string
 */
export const formatUTCTime = (utc: UTCDateTime): string => {
  return moment.utc()
    .year(utc.year)
    .month(utc.month - 1)
    .date(utc.day)
    .hour(utc.hour)
    .minute(utc.minute)
    .format();
}; 