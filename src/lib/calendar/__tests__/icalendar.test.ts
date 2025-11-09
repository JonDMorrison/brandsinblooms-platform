/**
 * Tests for iCalendar (.ics) generation utilities
 */

import { generateICalendar, getICalendarFilename } from '../icalendar';
import { EventWithRelations } from '@/lib/queries/domains/events';

describe('iCalendar generation', () => {
  const mockEvent: EventWithRelations = {
    id: 'event-123',
    site_id: 'site-abc',
    title: 'Growing Veggies @ Home',
    subtitle: 'Learn to grow your own food',
    slug: 'growing-veggies-home',
    description: 'Join us for a hands-on workshop where you will learn the basics of vegetable gardening.',
    start_datetime: '2025-01-09T20:15:00Z',
    end_datetime: '2025-01-09T21:15:00Z',
    timezone: 'America/Los_Angeles',
    is_all_day: false,
    location: 'Community Garden, 123 Main St',
    status: 'published',
    published_at: '2025-01-01T00:00:00Z',
    featured_image_id: null,
    created_at: '2025-01-01T00:00:00Z',
    created_by: 'user-123',
    deleted_at: null,
    meta_data: null,
    occurrences: [
      {
        id: 'occurrence-1',
        event_id: 'event-123',
        start_datetime: '2025-01-09T20:15:00Z',
        end_datetime: '2025-01-09T21:15:00Z',
        is_all_day: false,
        location: null, // Inherits from event
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        deleted_at: null,
        meta_data: null,
      },
    ],
  };

  const mockAllDayEvent: EventWithRelations = {
    ...mockEvent,
    id: 'event-456',
    title: 'Plant Sale',
    description: 'Annual plant sale event',
    is_all_day: true,
    location: 'Community Center',
    occurrences: [
      {
        id: 'occurrence-2',
        event_id: 'event-456',
        start_datetime: '2025-01-15T00:00:00Z',
        end_datetime: '2025-01-15T23:59:59Z',
        is_all_day: true,
        location: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        deleted_at: null,
        meta_data: null,
      },
    ],
  };

  describe('generateICalendar', () => {
    it('should generate valid iCalendar with VCALENDAR wrapper', () => {
      const ics = generateICalendar([mockEvent], 'Test Calendar', 'test.com');

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('END:VCALENDAR');
      expect(ics).toContain('PRODID:-//Test Calendar//Events Calendar//EN');
    });

    it('should generate VEVENT for each occurrence', () => {
      const ics = generateICalendar([mockEvent], 'Test Calendar', 'test.com');

      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('UID:event-event-123-occurrence-occurrence-1@test.com');
    });

    it('should include required VEVENT fields', () => {
      const ics = generateICalendar([mockEvent], 'Test Calendar', 'test.com');

      // Required fields
      expect(ics).toContain('UID:');
      expect(ics).toContain('DTSTAMP:');
      expect(ics).toContain('DTSTART:');
      expect(ics).toContain('SUMMARY:');
    });

    it('should format datetime events correctly', () => {
      const ics = generateICalendar([mockEvent], 'Test Calendar', 'test.com');

      expect(ics).toContain('DTSTART:20250109T201500Z');
      expect(ics).toContain('DTEND:20250109T211500Z');
      expect(ics).toContain('SUMMARY:Growing Veggies @ Home');
      expect(ics).toContain('LOCATION:Community Garden\\, 123 Main St');
    });

    it('should format all-day events with DATE format', () => {
      const ics = generateICalendar([mockAllDayEvent], 'Test Calendar', 'test.com');

      expect(ics).toContain('DTSTART;VALUE=DATE:20250115');
      // All-day events have exclusive end date (next day)
      expect(ics).toContain('DTEND;VALUE=DATE:20250116');
    });

    it('should escape special characters in text fields', () => {
      const eventWithSpecialChars: EventWithRelations = {
        ...mockEvent,
        title: 'Test; Event, with: special chars',
        description: 'Line 1\nLine 2\nLine 3', // Actual newlines
        location: 'Room 1, Building A; 123 Main St',
      };

      const ics = generateICalendar([eventWithSpecialChars], 'Test Calendar', 'test.com');

      // Semicolons, commas, and newlines should be escaped
      expect(ics).toContain('SUMMARY:Test\\; Event\\, with: special chars');
      expect(ics).toContain('DESCRIPTION:Line 1\\nLine 2\\nLine 3');
      expect(ics).toContain('LOCATION:Room 1\\, Building A\\; 123 Main St');
    });

    it('should handle events with multiple occurrences', () => {
      const eventWithMultipleOccurrences: EventWithRelations = {
        ...mockEvent,
        occurrences: [
          {
            id: 'occurrence-1',
            event_id: 'event-123',
            start_datetime: '2025-01-09T20:15:00Z',
            end_datetime: '2025-01-09T21:15:00Z',
            is_all_day: false,
            location: null,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
            deleted_at: null,
            meta_data: null,
          },
          {
            id: 'occurrence-2',
            event_id: 'event-123',
            start_datetime: '2025-01-16T20:15:00Z',
            end_datetime: '2025-01-16T21:15:00Z',
            is_all_day: false,
            location: null,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
            deleted_at: null,
            meta_data: null,
          },
        ],
      };

      const ics = generateICalendar([eventWithMultipleOccurrences], 'Test Calendar', 'test.com');

      // Should have 2 VEVENTs
      const veventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
      expect(veventCount).toBe(2);

      // Should have unique UIDs
      expect(ics).toContain('UID:event-event-123-occurrence-occurrence-1@test.com');
      expect(ics).toContain('UID:event-event-123-occurrence-occurrence-2@test.com');
    });

    it('should handle multiple events', () => {
      const ics = generateICalendar([mockEvent, mockAllDayEvent], 'Test Calendar', 'test.com');

      const veventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
      expect(veventCount).toBe(2);

      expect(ics).toContain('Growing Veggies @ Home');
      expect(ics).toContain('Plant Sale');
    });

    it('should include event description and location', () => {
      const ics = generateICalendar([mockEvent], 'Test Calendar', 'test.com');

      expect(ics).toContain('DESCRIPTION:Join us for a hands-on workshop');
      expect(ics).toContain('LOCATION:Community Garden\\, 123 Main St');
    });

    it('should handle events without description', () => {
      const eventWithoutDescription: EventWithRelations = {
        ...mockEvent,
        description: null,
      };

      const ics = generateICalendar([eventWithoutDescription], 'Test Calendar', 'test.com');

      expect(ics).not.toContain('DESCRIPTION:');
      expect(ics).toContain('SUMMARY:Growing Veggies @ Home');
    });

    it('should handle occurrence-specific location override', () => {
      const eventWithOccurrenceLocation: EventWithRelations = {
        ...mockEvent,
        location: 'Default Location',
        occurrences: [
          {
            id: 'occurrence-1',
            event_id: 'event-123',
            start_datetime: '2025-01-09T20:15:00Z',
            end_datetime: '2025-01-09T21:15:00Z',
            is_all_day: false,
            location: 'Override Location', // This should be used instead
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
            deleted_at: null,
            meta_data: null,
          },
        ],
      };

      const ics = generateICalendar([eventWithOccurrenceLocation], 'Test Calendar', 'test.com');

      expect(ics).toContain('LOCATION:Override Location');
      expect(ics).not.toContain('LOCATION:Default Location');
    });

    it('should set STATUS based on event status', () => {
      const publishedIcs = generateICalendar([mockEvent], 'Test Calendar', 'test.com');
      expect(publishedIcs).toContain('STATUS:CONFIRMED');

      const draftEvent: EventWithRelations = { ...mockEvent, status: 'draft' };
      const draftIcs = generateICalendar([draftEvent], 'Test Calendar', 'test.com');
      expect(draftIcs).toContain('STATUS:TENTATIVE');
    });

    it('should end with CRLF', () => {
      const ics = generateICalendar([mockEvent], 'Test Calendar', 'test.com');

      expect(ics.endsWith('\r\n')).toBe(true);
    });

    it('should handle empty events array', () => {
      const ics = generateICalendar([], 'Test Calendar', 'test.com');

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
      expect(ics).not.toContain('BEGIN:VEVENT');
    });
  });

  describe('getICalendarFilename', () => {
    it('should generate valid filename from calendar name', () => {
      expect(getICalendarFilename('Soul Bloom Sanctuary')).toBe('soul-bloom-sanctuary.ics');
    });

    it('should sanitize special characters', () => {
      expect(getICalendarFilename('Test@Calendar! #123')).toBe('testcalendar-123.ics');
    });

    it('should replace spaces with hyphens', () => {
      expect(getICalendarFilename('My Events Calendar')).toBe('my-events-calendar.ics');
    });

    it('should handle multiple consecutive spaces/hyphens', () => {
      expect(getICalendarFilename('Test   Calendar---Name')).toBe('test-calendar-name.ics');
    });

    it('should truncate long names', () => {
      const longName = 'a'.repeat(100);
      const filename = getICalendarFilename(longName);

      expect(filename.length).toBeLessThanOrEqual(54); // 50 chars + '.ics'
      expect(filename.endsWith('.ics')).toBe(true);
    });

    it('should handle empty calendar name', () => {
      expect(getICalendarFilename('')).toBe('events.ics');
    });

    it('should handle only special characters', () => {
      expect(getICalendarFilename('!@#$%^&*()')).toBe('events.ics');
    });
  });
});
