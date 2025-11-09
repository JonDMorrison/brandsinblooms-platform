# Events Calendar Feed (.ics)

Dynamic iCalendar (.ics) endpoint for subscribing to site events in calendar applications.

## Overview

The calendar feed endpoint generates RFC 5545 compliant iCalendar files that can be subscribed to in any calendar application (Google Calendar, Apple Calendar, Outlook, etc.).

## Endpoint

```
GET /api/calendar/[siteId]/events.ics
```

### Parameters

- `siteId` (path parameter, required): UUID of the site

### Response

- **Content-Type**: `text/calendar; charset=utf-8`
- **Content-Disposition**: `attachment; filename="[site-name].ics"`
- **Cache-Control**: `public, max-age=300, s-maxage=300` (5 minutes)

## Features

- Only includes **published events** with **future occurrences**
- Handles both **datetime events** and **all-day events**
- Supports **multiple occurrences per event** (recurring events)
- **Timezone-aware** (UTC formatting)
- **RFC 5545 compliant** (validated format)
- **Multi-tenant secure** (site isolation)
- **Public endpoint** (no authentication required)

## Event Fields Included

### Required Fields
- **UID**: Unique identifier (`event-{eventId}-occurrence-{occurrenceId}@{domain}`)
- **DTSTAMP**: Timestamp of calendar generation
- **DTSTART**: Event start time/date
- **SUMMARY**: Event title

### Optional Fields
- **DTEND**: Event end time/date (if provided)
- **DESCRIPTION**: Event description
- **LOCATION**: Event location (occurrence-specific or inherited from event)
- **STATUS**: Event status (CONFIRMED for published, TENTATIVE for others)
- **SEQUENCE**: Version number (0 for initial)

## Date/Time Formatting

### Datetime Events (with time)
```
DTSTART:20250109T201500Z
DTEND:20250109T211500Z
```
- Format: `YYYYMMDDTHHmmssZ` (UTC)

### All-Day Events
```
DTSTART;VALUE=DATE:20250109
DTEND;VALUE=DATE:20250110
```
- Format: `YYYYMMDD` (DATE type)
- DTEND is exclusive (next day)

## Text Escaping

Special characters are properly escaped per RFC 5545:
- Semicolons: `\;`
- Commas: `\,`
- Newlines: `\n`
- Backslashes: `\\`

## Usage Examples

### Subscribe in Google Calendar

1. Copy the calendar feed URL:
   ```
   https://yourdomain.com/api/calendar/abc-123-def-456/events.ics
   ```

2. In Google Calendar:
   - Click **+** next to "Other calendars"
   - Select **From URL**
   - Paste the calendar feed URL
   - Click **Add calendar**

### Subscribe in Apple Calendar

1. Open Calendar app
2. **File** → **New Calendar Subscription**
3. Paste the calendar feed URL
4. Configure refresh interval (recommended: every hour)
5. Click **OK**

### Subscribe in Outlook

1. In Outlook Calendar
2. **Add Calendar** → **From Internet**
3. Paste the calendar feed URL
4. Click **OK**

## Implementation Details

### Architecture

```
Client Request
    ↓
API Route Handler (route.ts)
    ↓
Validate Site ID
    ↓
Fetch Published Events (events.ts query)
    ↓
Generate iCalendar (icalendar.ts utility)
    ↓
Return .ics File
```

### Files

1. **API Route**: `/app/api/calendar/[siteId]/events.ics/route.ts`
   - Handles GET requests
   - Validates site ID
   - Fetches events from database
   - Generates .ics file

2. **Query Function**: `/src/lib/queries/domains/events.ts`
   - `getPublishedEventsForCalendar(supabase, siteId)`
   - Returns published events with future occurrences
   - Inherits location from event if not set on occurrence

3. **Utilities**: `/src/lib/calendar/icalendar.ts`
   - `generateICalendar(events, calendarName, domain)`: Generate .ics content
   - `getICalendarFilename(calendarName)`: Generate filename
   - Internal helper functions for formatting and escaping

### Database Query

The query fetches:
- All published events for the site
- Future occurrences only (start_datetime >= now)
- Non-deleted events and occurrences
- Sorted by start_datetime (ascending)

```sql
-- Simplified query logic
SELECT * FROM events
WHERE site_id = $1
  AND status = 'published'
  AND deleted_at IS NULL

-- For each event:
SELECT * FROM event_occurrences
WHERE event_id = $1
  AND start_datetime >= NOW()
  AND deleted_at IS NULL
ORDER BY start_datetime ASC
```

## Error Handling

### 400 Bad Request
- Invalid site ID format (not a UUID)

### 404 Not Found
- Site does not exist
- Site is deleted

### 500 Internal Server Error
- Database connection issues
- Unexpected errors during generation

## Performance Considerations

### Caching
- Response cached for 5 minutes (CDN + browser)
- Reduces database load for frequently accessed feeds

### Query Optimization
- Filters events at database level
- Only fetches required fields
- Uses indexed columns (site_id, status, start_datetime)

### Scalability
- Handles sites with hundreds of events
- Each occurrence generates a separate VEVENT
- Line folding for long text fields (75 char limit)

## Testing

### Unit Tests
See: `/src/lib/calendar/__tests__/icalendar.test.ts`

Tests cover:
- ✅ Valid iCalendar generation
- ✅ VEVENT format
- ✅ Datetime vs all-day events
- ✅ Special character escaping
- ✅ Multiple occurrences
- ✅ Location inheritance
- ✅ Event status mapping
- ✅ Filename generation

### Manual Testing

1. Create test events in your site
2. Publish events with future dates
3. Access: `http://localhost:3001/api/calendar/[your-site-id]/events.ics`
4. Verify .ics file downloads
5. Import into calendar app
6. Verify events display correctly

### Validation Tools

- [iCalendar Validator](https://icalendar.org/validator.html)
- Copy .ics content and validate format

## Future Enhancements

Potential improvements:
- [ ] Filter by date range (`?start=YYYY-MM-DD&end=YYYY-MM-DD`)
- [ ] Filter by event category/tag
- [ ] RRULE support (true recurring events)
- [ ] VALARM support (event reminders)
- [ ] GEO support (GPS coordinates for location)
- [ ] ORGANIZER field (event creator)
- [ ] Per-occurrence updates (SEQUENCE incrementing)
- [ ] Private/public event filtering
- [ ] Authentication for private calendars

## Related Documentation

- [RFC 5545 - iCalendar Specification](https://tools.ietf.org/html/rfc5545)
- [Events Management Spec](./events-management-spec.md)
- [Events Management Spec (Adapted)](./events-management-spec-adapted.md)

## Troubleshooting

### Events not appearing in calendar

1. **Check event is published**: Draft events are excluded
2. **Check occurrence date**: Past occurrences are excluded
3. **Verify site ID**: Ensure correct UUID in URL
4. **Check deletion**: Soft-deleted events won't appear
5. **Clear calendar cache**: Some apps cache feeds

### Calendar not updating

- Calendar apps refresh on different schedules
- Google Calendar: ~24 hours
- Apple Calendar: Configurable (hourly recommended)
- Force refresh in calendar app settings

### Invalid .ics file

- Ensure all text fields are properly escaped
- Check date/time formats are correct
- Validate with online iCalendar validator
- Check for special characters in event data
