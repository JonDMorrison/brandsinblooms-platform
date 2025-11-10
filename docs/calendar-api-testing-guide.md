# Calendar API Testing Guide

Quick guide to manually test the iCalendar feed endpoint.

## Prerequisites

1. Local development server running (`pnpm dev`)
2. Database seeded with Soul Bloom Sanctuary site
3. At least one published event with a future date

## Test Steps

### 1. Create Test Event (if needed)

```sql
-- Connect to local Supabase
-- Create a test event with future date
INSERT INTO events (
  id,
  site_id,
  title,
  slug,
  description,
  start_datetime,
  timezone,
  status,
  published_at
) VALUES (
  gen_random_uuid(),
  'aaaaaaaa-bbbb-cccc-dddd-111111111111', -- Soul Bloom Sanctuary
  'Test Calendar Event',
  'test-calendar-event',
  'This is a test event for calendar feed testing',
  (NOW() + INTERVAL '7 days')::timestamp,
  'America/Los_Angeles',
  'published',
  NOW()
);
```

### 2. Get Site ID

```bash
# Soul Bloom Sanctuary (seeded site)
SITE_ID="aaaaaaaa-bbbb-cccc-dddd-111111111111"
```

Or query the database:
```sql
SELECT id, name, subdomain FROM sites WHERE deleted_at IS NULL;
```

### 3. Test API Endpoint

#### Browser Test
```
http://localhost:3001/api/calendar/aaaaaaaa-bbbb-cccc-dddd-111111111111/events.ics
```

Expected: .ics file download

#### cURL Test
```bash
curl -v http://localhost:3001/api/calendar/aaaaaaaa-bbbb-cccc-dddd-111111111111/events.ics
```

Expected output:
```
< HTTP/1.1 200 OK
< Content-Type: text/calendar; charset=utf-8
< Content-Disposition: attachment; filename="soul-bloom-sanctuary.ics"
< Cache-Control: public, max-age=300, s-maxage=300
<
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Soul Bloom Sanctuary//Events Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Soul Bloom Sanctuary Events
X-WR-TIMEZONE:UTC
BEGIN:VEVENT
UID:event-...
DTSTAMP:...
DTSTART:...
DTEND:...
SUMMARY:Test Calendar Event
DESCRIPTION:This is a test event for calendar feed testing
LOCATION:...
SEQUENCE:0
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

### 4. Validate .ics Format

#### Save to file
```bash
curl http://localhost:3001/api/calendar/aaaaaaaa-bbbb-cccc-dddd-111111111111/events.ics > test.ics
```

#### Validate online
1. Go to https://icalendar.org/validator.html
2. Upload `test.ics`
3. Check for validation errors

### 5. Test in Calendar Applications

#### Google Calendar

1. Open Google Calendar (https://calendar.google.com)
2. Click **+** next to "Other calendars"
3. Select **From URL**
4. Paste: `http://localhost:3001/api/calendar/aaaaaaaa-bbbb-cccc-dddd-111111111111/events.ics`
5. Click **Add calendar**
6. Verify events appear

Note: Google Calendar may not support localhost URLs. Use ngrok or similar for testing:
```bash
ngrok http 3001
# Use ngrok URL: https://abc123.ngrok.io/api/calendar/...
```

#### Apple Calendar (macOS)

1. Open Calendar app
2. **File** → **New Calendar Subscription**
3. Paste the calendar feed URL
4. Click **Subscribe**
5. Configure settings:
   - Auto-refresh: Every hour
   - Remove: Never
6. Click **OK**
7. Verify events appear in calendar

#### Import .ics file (any calendar app)

1. Download .ics file:
   ```bash
   curl http://localhost:3001/api/calendar/aaaaaaaa-bbbb-cccc-dddd-111111111111/events.ics > events.ics
   ```
2. Import in calendar app:
   - **Google Calendar**: Settings → Import & Export → Import
   - **Apple Calendar**: File → Import
   - **Outlook**: File → Open & Export → Import/Export

### 6. Test Error Cases

#### Invalid Site ID (400)
```bash
curl -i http://localhost:3001/api/calendar/invalid-id/events.ics
```
Expected: `400 Bad Request - Invalid site ID format`

#### Non-existent Site (404)
```bash
curl -i http://localhost:3001/api/calendar/00000000-0000-0000-0000-000000000000/events.ics
```
Expected: `404 Not Found - Site not found`

#### Deleted Site (404)
```sql
-- Soft delete a site
UPDATE sites SET deleted_at = NOW() WHERE id = '...';
```
```bash
curl -i http://localhost:3001/api/calendar/.../events.ics
```
Expected: `404 Not Found - Site not found`

### 7. Test Event Filtering

#### Published Events Only
```sql
-- Create draft event
INSERT INTO events (..., status) VALUES (..., 'draft');
```
Draft events should NOT appear in .ics feed.

#### Future Events Only
```sql
-- Create past event
INSERT INTO events (..., start_datetime) VALUES (..., NOW() - INTERVAL '7 days');
```
Past events should NOT appear in .ics feed.

### 8. Test Special Cases

#### All-Day Events
```sql
INSERT INTO events (
  ...,
  is_all_day,
  start_datetime,
  end_datetime
) VALUES (
  ...,
  true,
  '2025-01-15 00:00:00',
  '2025-01-15 23:59:59'
);
```

Expected in .ics:
```
DTSTART;VALUE=DATE:20250115
DTEND;VALUE=DATE:20250116
```
(Note: DTEND is exclusive for all-day events)

#### Multiple Occurrences
```sql
-- Create event occurrences
INSERT INTO event_occurrences (event_id, start_datetime, end_datetime) VALUES
  ('event-id', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '2 hours'),
  ('event-id', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '2 hours');
```

Expected: 2 separate VEVENT entries with unique UIDs.

#### Special Characters in Text
```sql
INSERT INTO events (
  ...,
  title,
  description,
  location
) VALUES (
  ...,
  'Event; with, special: chars',
  'Line 1
Line 2
Line 3',
  'Room 1, Building A; 123 Main St'
);
```

Expected escaping:
```
SUMMARY:Event\; with\, special: chars
DESCRIPTION:Line 1\nLine 2\nLine 3
LOCATION:Room 1\, Building A\; 123 Main St
```

### 9. Performance Testing

#### Cache Headers
```bash
curl -I http://localhost:3001/api/calendar/.../events.ics
```

Expected:
```
Cache-Control: public, max-age=300, s-maxage=300
```

#### Response Time
```bash
time curl http://localhost:3001/api/calendar/.../events.ics > /dev/null
```

Expected: < 500ms for typical sites (10-50 events)

#### Large Event Set
```sql
-- Create 100 test events
INSERT INTO events (...)
SELECT ... FROM generate_series(1, 100);
```

Test response time and .ics file size.

## Checklist

- [ ] API endpoint accessible
- [ ] .ics file downloads correctly
- [ ] Valid iCalendar format (validator)
- [ ] Events appear in Google Calendar
- [ ] Events appear in Apple Calendar
- [ ] Events appear in Outlook
- [ ] Only published events included
- [ ] Only future events included
- [ ] All-day events formatted correctly
- [ ] Multiple occurrences work
- [ ] Special characters escaped
- [ ] Error cases handled (400, 404, 500)
- [ ] Cache headers present
- [ ] Response time acceptable

## Troubleshooting

### .ics file is empty
- Check events are published (`status = 'published'`)
- Check events have future dates
- Check site ID is correct
- Check events have occurrences

### Events not appearing in calendar app
- Verify .ics format with validator
- Check date/time formatting
- Try importing as file instead of URL
- Check calendar app supports webcal subscriptions

### Calendar not updating
- Calendar apps have different refresh intervals
- Try force refresh in app settings
- Check cache headers are correct
- Clear browser cache

### Special characters display incorrectly
- Verify escaping in .ics file
- Check UTF-8 encoding
- Test with different calendar apps

## Debugging

### Enable verbose logging
```typescript
// In route.ts
console.log('Fetched events:', events.length)
console.log('Generated .ics length:', icsContent.length)
```

### Inspect database
```sql
-- Check published events
SELECT id, title, status, start_datetime
FROM events
WHERE site_id = 'aaaaaaaa-bbbb-cccc-dddd-111111111111'
  AND status = 'published'
  AND deleted_at IS NULL;

-- Check occurrences
SELECT eo.*, e.title
FROM event_occurrences eo
JOIN events e ON e.id = eo.event_id
WHERE e.site_id = 'aaaaaaaa-bbbb-cccc-dddd-111111111111'
  AND eo.start_datetime >= NOW()
  AND eo.deleted_at IS NULL;
```

### Validate JSON response
```bash
# Check site exists
curl http://localhost:3001/api/sites/aaaaaaaa-bbbb-cccc-dddd-111111111111
```

## Next Steps

After successful testing:
1. Deploy to staging environment
2. Test with production-like data
3. Monitor error logs
4. Integrate frontend components
5. Update user documentation
