import { format, formatDistanceToNow, differenceInSeconds, parseISO } from 'date-fns';

// =============================================================================
// ExamGuard Cloud — Date Utilities
// =============================================================================

/**
 * Format an ISO date string to a readable format.
 * Example: "2025-07-21 10:23:45"
 */
export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  } catch {
    return '';
  }
}

/**
 * Format a date as a short relative time string.
 * Example: "2 minutes ago"
 */
export function formatRelative(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '';
  }
}

/**
 * Format seconds as MM:SS or HH:MM:SS.
 * Example: 4343 → "1:12:23"
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Calculate remaining seconds until a given end time.
 * Returns 0 if the end time has passed or is null.
 */
export function getRemainingSeconds(endTimeStr: string | null | undefined): number {
  if (!endTimeStr) return 0;
  try {
    const endDate = parseISO(endTimeStr);
    const remaining = differenceInSeconds(endDate, new Date());
    return Math.max(0, remaining);
  } catch {
    return 0;
  }
}

/**
 * Format a datetime-local input value to ISO string.
 */
export function localInputToISO(value: string): string | null {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

/**
 * Format an ISO date string to a datetime-local input value.
 */
export function isoToLocalInput(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  try {
    const date = parseISO(isoStr);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}
