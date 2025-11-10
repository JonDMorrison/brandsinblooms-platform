/**
 * iCalendar (.ics) generation utilities
 * Generates RFC 5545 compliant iCalendar format for events
 */

import { EventWithRelations, EventOccurrence } from '@/src/lib/queries/domains/events';

/**
 * Format a Date to iCalendar DATETIME format (UTC)
 * Format: YYYYMMDDTHHmmssZ
 * Example: 20250109T201500Z
 */
function formatDateTime(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Format a Date to iCalendar DATE format (all-day events)
 * Format: YYYYMMDD
 * Example: 20250109
 */
function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

/**
 * Escape special characters in iCalendar text fields
 * Per RFC 5545, escape: backslash, semicolon, comma, newline
 */
function escapeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')    // Normalize CRLF to LF first
    .replace(/\r/g, '\n')      // Normalize CR to LF
    .replace(/\\/g, '\\\\')    // Escape backslashes first
    .replace(/;/g, '\\;')      // Escape semicolons
    .replace(/,/g, '\\,')      // Escape commas
    .replace(/\n/g, '\\n');    // Escape newlines (actual newline chars, not literal \n)
}

/**
 * Fold lines to 75 characters per RFC 5545
 * Long lines must be split with CRLF + space
 */
function foldLine(line: string): string {
  const maxLength = 75;
  if (line.length <= maxLength) {
    return line;
  }

  const result: string[] = [];
  let currentPos = 0;

  // First line can be 75 chars
  result.push(line.substring(0, maxLength));
  currentPos = maxLength;

  // Subsequent lines are 74 chars (accounting for leading space)
  while (currentPos < line.length) {
    result.push(' ' + line.substring(currentPos, currentPos + 74));
    currentPos += 74;
  }

  return result.join('\r\n');
}

/**
 * Generate a unique UID for an event occurrence
 * Format: event-{eventId}-occurrence-{occurrenceId}@{domain}
 */
function generateUID(eventId: string, occurrenceId: string, domain: string): string {
  return `event-${eventId}-occurrence-${occurrenceId}@${domain}`;
}

/**
 * Generate VEVENT component for a single event occurrence
 */
function generateVEvent(
  event: EventWithRelations,
  occurrence: EventOccurrence,
  domain: string
): string {
  const lines: string[] = [];

  lines.push('BEGIN:VEVENT');

  // UID (required, unique identifier)
  const uid = generateUID(event.id, occurrence.id, domain);
  lines.push(foldLine(`UID:${uid}`));

  // DTSTAMP (required, creation/modification timestamp)
  const now = new Date();
  lines.push(foldLine(`DTSTAMP:${formatDateTime(now)}`));

  // DTSTART (required, event start)
  const startDate = new Date(occurrence.start_datetime);
  if (occurrence.is_all_day) {
    lines.push(foldLine(`DTSTART;VALUE=DATE:${formatDate(startDate)}`));
  } else {
    lines.push(foldLine(`DTSTART:${formatDateTime(startDate)}`));
  }

  // DTEND (end time)
  if (occurrence.end_datetime) {
    const endDate = new Date(occurrence.end_datetime);
    if (occurrence.is_all_day) {
      // For all-day events, DTEND is exclusive (next day)
      const nextDay = new Date(endDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      lines.push(foldLine(`DTEND;VALUE=DATE:${formatDate(nextDay)}`));
    } else {
      lines.push(foldLine(`DTEND:${formatDateTime(endDate)}`));
    }
  }

  // SUMMARY (required, event title)
  const summary = escapeText(event.title);
  lines.push(foldLine(`SUMMARY:${summary}`));

  // DESCRIPTION (optional, event description)
  if (event.description) {
    const description = escapeText(event.description);
    lines.push(foldLine(`DESCRIPTION:${description}`));
  }

  // LOCATION (optional, event location)
  // Occurrence location overrides event location
  const location = occurrence.location || event.location;
  if (location) {
    const escapedLocation = escapeText(location);
    lines.push(foldLine(`LOCATION:${escapedLocation}`));
  }

  // SEQUENCE (version number, starts at 0)
  lines.push('SEQUENCE:0');

  // STATUS (event status)
  if (event.status === 'published') {
    lines.push('STATUS:CONFIRMED');
  } else {
    lines.push('STATUS:TENTATIVE');
  }

  lines.push('END:VEVENT');

  return lines.join('\r\n');
}

/**
 * Generate complete iCalendar (.ics) file for events
 */
export function generateICalendar(
  events: EventWithRelations[],
  calendarName: string,
  domain: string
): string {
  const lines: string[] = [];

  // VCALENDAR wrapper
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push(foldLine(`PRODID:-//${calendarName}//Events Calendar//EN`));
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push(foldLine(`X-WR-CALNAME:${escapeText(calendarName)} Events`));
  lines.push(`X-WR-TIMEZONE:UTC`);

  // Generate VEVENT for each occurrence
  for (const event of events) {
    if (event.occurrences && event.occurrences.length > 0) {
      for (const occurrence of event.occurrences) {
        const vevent = generateVEvent(event, occurrence, domain);
        lines.push(vevent);
      }
    }
  }

  lines.push('END:VCALENDAR');

  // Join with CRLF and ensure trailing newline
  return lines.join('\r\n') + '\r\n';
}

/**
 * Get appropriate filename for iCalendar download
 */
export function getICalendarFilename(calendarName: string): string {
  // Sanitize calendar name for filename
  const sanitized = calendarName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  return `${sanitized || 'events'}.ics`;
}
