/**
 * Timezone conversion utilities
 * All times from API are in UTC format and need to be converted to company timezone for display
 * All times sent to API must be converted from company timezone to UTC
 */
import { DateTime } from "luxon";

// Local storage key for timezone
const TIMEZONE_STORAGE_KEY = 'company_timezone';

/**
 * Save timezone to localStorage
 * @param timezone - IANA timezone identifier
 */
export const saveTimezoneToStorage = (timezone: string): void => {
  try {
    localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
    console.log('Timezone saved to localStorage:', timezone);
  } catch (error) {
    console.error('Failed to save timezone to localStorage:', error);
  }
};

/**
 * Get timezone from localStorage
 * @returns Timezone string or 'UTC' as default
 */
export const getTimezoneFromStorage = (): string => {
  try {
    const timezone = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    return timezone || 'UTC';
  } catch (error) {
    console.error('Failed to get timezone from localStorage:', error);
    return 'UTC';
  }
};

/**
 * Get current timezone (from localStorage or default to UTC)
 * This is used by all conversion functions
 */
const getCurrentTimezone = (): string => {
  return getTimezoneFromStorage();
};

/**
 * Format date-time for display in company timezone
 * @param utcDateString - ISO date string in UTC (e.g., "2026-02-14T10:00:00Z")
 * @param timezone - Optional IANA timezone identifier (uses localStorage if not provided)
 * @returns Formatted string like "Feb 14, 2026, 10:00 AM"
 */
export const formatDateTimeInTimezone = (utcDateString: string, timezone?: string): string => {
  const tz = timezone || getCurrentTimezone();
  const date = new Date(utcDateString);
  return date.toLocaleString('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format time only for display in company timezone
 * @param utcDateString - ISO date string in UTC
 * @param timezone - Optional IANA timezone identifier (uses localStorage if not provided)
 * @returns Formatted string like "10:00 AM"
 */
export const formatTimeInTimezone = (utcDateString: string, timezone?: string): string => {
  const tz = timezone || getCurrentTimezone();
  const date = new Date(utcDateString);
  return date.toLocaleString('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get date in YYYY-MM-DD format in company timezone
 * @param utcDateString - ISO date string in UTC
 * @param timezone - Optional IANA timezone identifier (uses localStorage if not provided)
 * @returns Date string in YYYY-MM-DD format
 */
export const getDateInTimezone = (utcDateString: string, timezone?: string): string => {
  const tz = timezone || getCurrentTimezone();
  const date = new Date(utcDateString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(date);
  const dateObj: any = {};

  parts.forEach(part => {
    if (part.type !== 'literal') {
      dateObj[part.type] = part.value;
    }
  });

  return `${dateObj.year}-${dateObj.month}-${dateObj.day}`;
};

/**
 * Get time in HH:MM format in company timezone
 * @param utcDateString - ISO date string in UTC
 * @param timezone - Optional IANA timezone identifier (uses localStorage if not provided)
 * @returns Time string in HH:MM format (24-hour)
 */
export const getTimeInTimezone = (utcDateString: string, timezone?: string): string => {
  const tz = timezone || getCurrentTimezone();
  const date = new Date(utcDateString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const dateObj: any = {};

  parts.forEach(part => {
    if (part.type !== 'literal') {
      dateObj[part.type] = part.value;
    }
  });

  return `${dateObj.hour}:${dateObj.minute}`;
};

/**
 * Create UTC ISO string from date and time strings in company timezone
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:MM format (24-hour)
 * @param timezone - Optional IANA timezone identifier (uses localStorage if not provided)
 * @returns ISO string in UTC format
 */
export const createUTCFromLocalDateTime = (
  dateStr: string,
  timeStr: string,
  timezone?: string
): string => {
  const tz = timezone || getCurrentTimezone();

  const dateTime = DateTime.fromISO(
    `${dateStr}T${timeStr}`,
    { zone: tz }
  );

  if (!dateTime.isValid) {
    throw new Error("Invalid date/time for timezone (possible DST issue)");
  }

  return dateTime.toUTC().toISO();
};

/**
 * Convert UTC ISO string to Date object displayed in company timezone
 * This is mainly for FullCalendar which needs Date objects
 * @param utcDateString - ISO date string in UTC
 * @returns Date object (will display correctly when formatted with timezone)
 */
export const utcToLocalDate = (utcDateString: string): Date => {
  // FullCalendar handles timezone internally, so we just return the Date object
  // The calendar's timeZone property will handle the display
  return new Date(utcDateString);
};

/**
 * Convert local Date object to UTC ISO string
 * @param localDate - Date object in local time
 * @returns ISO string in UTC format
 */
export const localDateToUTC = (localDate: Date): string => {
  return localDate.toISOString();
};

