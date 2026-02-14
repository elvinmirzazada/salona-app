/**
 * Timezone conversion utilities
 * All times from API are in UTC format and need to be converted to company timezone for display
 * All times sent to API must be converted from company timezone to UTC
 */

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
export const createUTCFromLocalDateTime = (dateStr: string, timeStr: string, timezone?: string): string => {
  const tz = timezone || getCurrentTimezone();

  // Parse the input components
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  // Create a date string that includes timezone info
  // We'll use a trick: create a date, format it in both the target TZ and UTC, then calculate the difference

  // Start with a Date object representing this date/time (will be in local browser timezone, but we'll adjust)
  const tempDate = new Date(year, month - 1, day, hour, minute, 0);

  // Format this date in the target timezone
  const targetTZString = tempDate.toLocaleString('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Format the same date in UTC
  const utcString = tempDate.toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Parse both strings to get timestamps
  const parseLocaleString = (str: string): number => {
    // Format is "MM/DD/YYYY, HH:MM:SS"
    const [datePart, timePart] = str.split(', ');
    const [m, d, y] = datePart.split('/').map(Number);
    const [h, min, s] = timePart.split(':').map(Number);
    return Date.UTC(y, m - 1, d, h, min, s);
  };

  const targetTimestamp = parseLocaleString(targetTZString);
  const utcTimestamp = parseLocaleString(utcString);

  // The offset is the difference between what the date looks like in the target TZ vs UTC
  const offset = utcTimestamp - targetTimestamp;

  // Now we want our input (year, month, day, hour, minute) to be interpreted as being in the target timezone
  // So we create a UTC timestamp for those components, then subtract the offset
  const inputAsUTC = Date.UTC(year, month - 1, day, hour, minute, 0);
  const adjustedTimestamp = inputAsUTC - offset;

  return new Date(adjustedTimestamp).toISOString();
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

