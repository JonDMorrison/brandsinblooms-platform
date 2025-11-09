# Events Management System - Product Specification

## Overview

This specification defines the Events Management feature for a custom CMS system. The system enables content administrators to create, manage, and publish events that appear on the public website with calendar views and subscription capabilities.

---

## 1. Data Model

### Event Entity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Unique identifier |
| `title` | String(255) | Yes | Event title |
| `subtitle` | String(500) | No | Optional subtitle/tagline |
| `slug` | String(255) | Yes | URL-friendly identifier (auto-generated from title) |
| `location` | String(500) | No | Physical or virtual location |
| `body` | Rich Text | No | Event details/description (supports markdown/HTML) |
| `startDateTime` | DateTime | Yes | Event start date and time |
| `endDateTime` | DateTime | No | Event end date and time |
| `isAllDay` | Boolean | No | Indicates if event runs all day |
| `timezone` | String(50) | Yes | IANA timezone (e.g., "America/New_York") |
| `status` | Enum | Yes | `draft`, `published`, `unpublished` |
| `createdAt` | DateTime | Yes | Record creation timestamp |
| `updatedAt` | DateTime | Yes | Last modification timestamp |
| `createdBy` | UUID | Yes | Reference to user who created the event |
| `updatedBy` | UUID | Yes | Reference to user who last updated the event |

### Event Media

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Unique identifier |
| `eventId` | UUID | Yes | Foreign key to Event |
| `type` | Enum | Yes | `image`, `video` |
| `url` | String(2048) | Yes | Media file URL |
| `altText` | String(255) | No | Accessibility text for images |
| `caption` | String(500) | No | Optional caption |
| `order` | Integer | Yes | Display order (0-indexed) |

### Event Attachments

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Unique identifier |
| `eventId` | UUID | Yes | Foreign key to Event |
| `fileName` | String(255) | Yes | Original file name |
| `fileUrl` | String(2048) | Yes | File storage URL |
| `fileSize` | Integer | Yes | File size in bytes |
| `mimeType` | String(100) | Yes | File MIME type |
| `uploadedAt` | DateTime | Yes | Upload timestamp |

### Event Associations

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Unique identifier |
| `eventId` | UUID | Yes | Foreign key to Event |
| `relatedType` | Enum | Yes | `page`, `blog_post` |
| `relatedId` | UUID | Yes | Foreign key to related entity |
| `createdAt` | DateTime | Yes | Association timestamp |

---

## 2. Website Features

### 2.1 Events List Page

**Purpose**: Display all published events in a browsable list format.

**Requirements**:
- Display published events only (`status = 'published'`)
- Sort by `startDateTime` (ascending - soonest first)
- Show past events separately or filter them out based on configuration
- Each event card displays:
  - Title
  - Subtitle (if present)
  - Start date/time (formatted)
  - Location (if present)
  - Featured image (first image in order)
- Pagination or infinite scroll (configurable)
- Filter options:
  - By date range
  - Upcoming vs. Past events
  - Search by title/location

**Default View**:
```
[Event List View]
┌─────────────────────────────────────┐
│ Upcoming Events                      │
├─────────────────────────────────────┤
│ [Image] | Title                      │
│         | Subtitle                   │
│         | Dec 15, 2024 at 7:00 PM   │
│         | Location Name              │
├─────────────────────────────────────┤
│ [Image] | Title                      │
│         | Subtitle                   │
│         | Dec 20, 2024 at 2:00 PM   │
│         | Location Name              │
└─────────────────────────────────────┘
```

### 2.2 Event Calendar View

**Purpose**: Display events in a visual calendar interface.

**Requirements**:
- Monthly calendar view (default)
- Week view option
- Day view option
- Events displayed on their start date
- Multi-day events span across days
- Click on event to view details
- Click on date to see all events that day
- Navigation: Previous/Next month/week/day
- "Today" button to return to current date
- Color coding options (by category if implemented)
- All-day events displayed at top of day

**Visual Representation**:
```
[Calendar View - Month]
     December 2024
Su Mo Tu We Th Fr Sa
 1  2  3  4  5  6  7
 8  9 10 11 12 13 14
15[●]17 18 19 20 21  ← Event on 15th
22 23 24 25 26 27 28
29 30 31

● = Event indicator
```

### 2.3 Event Detail Page

**Purpose**: Display comprehensive information about a single event.

**Requirements**:
- SEO-friendly URL structure: `/events/{slug}`
- Display all event data:
  - Title and subtitle
  - Date/time information
  - Location
  - All images (gallery format)
  - Video embed (if present)
  - Full body content
  - File attachments (downloadable)
- "Add to Calendar" dropdown with options:
  - Apple Calendar (.ics)
  - Google Calendar
  - Outlook (.ics)
  - Yahoo Calendar
- Social sharing options
- Related pages/blog posts (if associated)
- Breadcrumb navigation
- Schema.org Event markup for SEO

### 2.4 Calendar Subscription

**Purpose**: Allow users to subscribe to event calendar in their preferred calendar application.

**Requirements**:
- Generate iCalendar (.ics) feed endpoint: `/events/calendar.ics`
- Include all published events
- Update dynamically as events are added/modified
- Support webcal:// protocol
- Subscription URL prominently displayed on events pages
- Instructions for subscribing on different platforms:
  - Apple Calendar (iOS, macOS)
  - Google Calendar
  - Outlook
  - Other iCal-compatible apps

**iCalendar Feed Requirements**:
- Include all required iCalendar properties:
  - `VCALENDAR` wrapper
  - `VERSION:2.0`
  - `PRODID` (application identifier)
  - `VEVENT` for each event
  - `UID`, `DTSTAMP`, `DTSTART`, `DTEND`, `SUMMARY`, `DESCRIPTION`, `LOCATION`
- Handle timezones correctly using `TZID`
- Support all-day events using `DATE` format
- Update feed in real-time or with minimal caching

---

## 3. Admin Features

### 3.1 Event Management Interface

**Dashboard View**:
- List all events (draft, published, unpublished)
- Search and filter:
  - By status
  - By date range
  - By creator
  - By title/location
- Quick actions:
  - Publish/Unpublish toggle
  - Duplicate event
  - Delete event
- Bulk actions:
  - Bulk publish/unpublish
  - Bulk delete

### 3.2 Event Editor

**Layout**:
```
┌─────────────────────────────────────────────────┐
│ Event Editor                          [Status ▼]│
├─────────────────────────────────────────────────┤
│ Title: [________________________]               │
│ Subtitle: [________________________]            │
│                                                 │
│ Date & Time                                     │
│ Start: [Date] [Time] [Timezone]                │
│ End:   [Date] [Time] [Timezone]                │
│ □ All Day Event                                │
│                                                 │
│ [Add Date] [+7 Days] [+30 Days] [Generate ▼]  │
│                                                 │
│ Location: [________________________]            │
│                                                 │
│ Body:                                           │
│ [Rich Text Editor                              ]│
│ [                                              ]│
│                                                 │
│ Images: [Upload] [+]                           │
│ Video:  [URL Input] or [Upload]                │
│ Files:  [Upload] [+]                           │
│                                                 │
│ Associations:                                   │
│ Pages: [Multi-select dropdown]                 │
│ Blog Posts: [Multi-select dropdown]            │
│                                                 │
│           [Save Draft] [Publish] [Cancel]       │
└─────────────────────────────────────────────────┘
```

### 3.3 Date Management

**Add Date Button**:
- Opens date/time picker
- Allows adding a new future event date
- Creates a new event with same content but different date
- Option to link events as a series (optional future enhancement)

**+7 Days Button**:
- Automatically creates duplicate event 7 days after current start date
- Copies all event content
- Opens editor in draft mode for review

**+30 Days Button**:
- Automatically creates duplicate event 30 days after current start date
- Copies all event content
- Opens editor in draft mode for review

**Generate Dates (RRule)**:
- Opens advanced recurrence modal
- Uses RRule (Recurrence Rule) standard
- Options:
  - Frequency: Daily, Weekly, Monthly, Yearly
  - Interval: Every X days/weeks/months/years
  - Days of week (for weekly recurrence)
  - End condition:
    - After X occurrences
    - On specific date
    - Never (with reasonable limit, e.g., 2 years)
- Preview of generated dates before confirmation
- Generates separate event records for each occurrence
- All generated events start in draft mode

**RRule Modal Example**:
```
┌─────────────────────────────────────┐
│ Generate Recurring Event Dates      │
├─────────────────────────────────────┤
│ Repeat: [Weekly ▼]                  │
│ Every:  [1] week(s)                 │
│                                     │
│ On: □ Sun □ Mon ☑ Tue □ Wed □ Thu  │
│     □ Fri □ Sat                     │
│                                     │
│ Ends:                               │
│ ○ After [10] occurrences            │
│ ○ On date [__________]              │
│ ● Never (max 2 years)               │
│                                     │
│ Preview:                            │
│ - Dec 15, 2024 at 7:00 PM          │
│ - Dec 22, 2024 at 7:00 PM          │
│ - Dec 29, 2024 at 7:00 PM          │
│ ... (7 more)                        │
│                                     │
│        [Cancel] [Generate Events]   │
└─────────────────────────────────────┘
```

### 3.4 All-Day Event Creation

**Behavior**:
- Checkbox: "All Day Event"
- When checked:
  - Time pickers are hidden
  - Only date pickers are shown
  - Start date must be specified
  - End date is optional (defaults to same as start date)
  - Stored as midnight-to-midnight in specified timezone
- In calendar view:
  - Displayed at top of calendar day
  - Shows as banner across day(s)
  - Different visual styling from timed events

### 3.5 Publish/Unpublish Controls

**Status Options**:
- **Draft**: Event is being created/edited, not visible on website
- **Published**: Event is live and visible on website
- **Unpublished**: Event was published but is now hidden

**Controls**:
- Status dropdown in editor header
- Quick toggle in event list
- Publish button in editor (changes status from draft → published)
- Unpublish option in actions menu
- Confirmation for status changes that affect visibility
- Audit log of status changes (who changed, when, from/to)

**Business Rules**:
- Cannot publish event without required fields (title, start date)
- Past events can be published (for archival purposes)
- Unpublishing removes from website immediately
- Draft events are only visible to admin users

### 3.6 Media Management

**Images**:
- Multiple images per event
- Drag-and-drop reordering
- First image is "featured" (used in list views)
- Image optimization on upload (resize, compress)
- Alt text field for accessibility
- Caption field (optional)
- Delete individual images

**Video**:
- Single video per event
- Options:
  - YouTube URL
  - Vimeo URL
  - Direct video upload (MP4, WebM)
- Video preview in editor
- Responsive embed on frontend

**File Attachments**:
- Multiple files per event
- Accepted types: PDF, DOC, DOCX, XLS, XLSX, ZIP, etc.
- File size limit: 10MB per file (configurable)
- Display file name, size, type
- Download link on frontend
- Delete individual attachments

### 3.7 Associations

**Purpose**: Link events to related pages and blog posts.

**Functionality**:
- Multi-select dropdown for pages
- Multi-select dropdown for blog posts
- Shows associated content in event detail page
- Bi-directional references (optional):
  - Show events on page/blog post as well

**Use Cases**:
- Event tied to a specific service page
- Event related to a blog post announcement
- Event series connected to campaign landing page

---

## 4. Technical Specifications

### 4.1 API Endpoints

**Public API** (Read-only):
```
GET    /api/events                    # List published events
GET    /api/events/:slug              # Get single event
GET    /api/events/calendar.ics       # iCalendar feed
GET    /api/events/calendar/monthly   # Calendar view data
```

**Admin API**:
```
GET    /api/admin/events              # List all events
POST   /api/admin/events              # Create event
GET    /api/admin/events/:id          # Get event for editing
PUT    /api/admin/events/:id          # Update event
DELETE /api/admin/events/:id          # Delete event
PATCH  /api/admin/events/:id/publish  # Publish event
PATCH  /api/admin/events/:id/unpublish # Unpublish event
POST   /api/admin/events/:id/duplicate # Duplicate event
POST   /api/admin/events/:id/generate-dates # Generate recurring dates

POST   /api/admin/events/:id/images   # Upload image
DELETE /api/admin/events/:id/images/:imageId # Delete image
PUT    /api/admin/events/:id/images/reorder # Reorder images

POST   /api/admin/events/:id/attachments # Upload file
DELETE /api/admin/events/:id/attachments/:attachmentId # Delete file
```

### 4.2 File Storage

- Media and attachments stored in cloud storage (S3, Cloudflare R2, etc.)
- Generate signed URLs for secure access
- Organize by event ID: `/events/{eventId}/{type}/{filename}`
- Automatic cleanup of orphaned files when event is deleted

### 4.3 Timezone Handling

- Store all dates in UTC in database
- Store user's selected timezone with event
- Convert to display timezone on frontend
- Handle daylight saving time transitions
- Default to system timezone or user's location

### 4.4 iCalendar Generation

- Use standard iCalendar library (ical.js, ics, or similar)
- Set appropriate cache headers (e.g., 1 hour)
- Include `LAST-MODIFIED` property
- Support `VALARM` for reminders (optional)
- Validate output against iCalendar spec

### 4.5 RRule Processing

- Use RRule library (rrule.js or similar)
- Generate occurrences up to reasonable limit
- Store RRule string with "template" event (optional)
- Validate date ranges don't exceed system limits
- Handle timezone complexities in recurring rules

### 4.6 Security & Permissions

- Admin authentication required for all admin endpoints
- Role-based access control:
  - **Admin**: Full access
  - **Editor**: Create, edit, publish
  - **Contributor**: Create, edit (cannot publish)
- Validate file uploads (type, size, content)
- Sanitize HTML input in body field (XSS prevention)
- Rate limiting on public API endpoints

### 4.7 Performance Considerations

- Index on `startDateTime` and `status` fields
- Cache calendar feed for 1 hour
- Lazy load images on frontend
- Paginate event lists
- Optimize images on upload (WebP format, multiple sizes)
- Consider CDN for media delivery

---

## 5. User Flows

### 5.1 Admin Creating a Single Event

1. Admin clicks "Create Event" button
2. Fills in event details (title, date, location, etc.)
3. Uploads images and/or video
4. Adds body content in rich text editor
5. Attaches files if needed
6. Associates with pages/blog posts (optional)
7. Clicks "Save Draft" or "Publish"
8. Event appears on website (if published)

### 5.2 Admin Creating Recurring Events

1. Admin creates first event instance
2. Saves event
3. Clicks "Generate Dates" button
4. Configures recurrence rule (weekly, monthly, etc.)
5. Reviews preview of generated dates
6. Clicks "Generate Events"
7. System creates draft events for each occurrence
8. Admin reviews and publishes events individually or in bulk

### 5.3 Public User Viewing Events

1. User navigates to Events page
2. Views list of upcoming events or calendar view
3. Clicks on event to see details
4. Reads full event information
5. Downloads attachments if interested
6. Clicks "Add to Calendar" to save event
7. Optionally subscribes to calendar feed

### 5.4 Public User Subscribing to Calendar

1. User finds "Subscribe to Calendar" link
2. Clicks to copy calendar feed URL
3. Opens calendar application (Apple Calendar, Google, etc.)
4. Adds new calendar subscription
5. Pastes feed URL
6. Calendar app fetches events automatically
7. Events stay synchronized with website

---

## 6. Edge Cases & Error Handling

### 6.1 Date/Time Edge Cases

- **Event spans midnight**: End time is next day
- **Multi-day event**: End date is several days after start
- **All-day multi-day event**: Displayed as banner across multiple days
- **Timezone changes**: Handle DST transitions
- **Past events**: Decision on whether to display or hide

### 6.2 Validation Rules

- Start date/time must be before end date/time
- Title required and must not be empty
- Slug must be unique
- File size limits enforced
- Image dimensions validated
- RRule must be valid syntax
- Cannot generate more than X events at once (e.g., 100)

### 6.3 Error Messages

- "Start date must be before end date"
- "Title is required"
- "File size exceeds 10MB limit"
- "Image upload failed. Please try again"
- "This recurrence rule would create too many events (max 100)"
- "Event with this slug already exists"

### 6.4 Data Migration

- Provide import tool for existing events (CSV, JSON)
- Map legacy data to new schema
- Handle missing or invalid data gracefully
- Preview import before committing

### 6.5 Deletion Behavior

- **Soft delete**: Event marked as deleted but not removed from database
- **Hard delete** (optional): Permanently remove event and all associated media
- Confirm before deleting (especially for published events)
- Orphaned media cleanup scheduled task

---

## 7. Future Enhancements (Out of Scope for V1)

- Event categories/tags
- Event registration/ticketing
- Attendee management
- Email reminders/notifications
- Event series linking (show all events in a series)
- Event capacity limits
- Waitlist functionality
- Event check-in system
- Analytics (views, registrations, calendar subscriptions)
- Public event submission (with approval workflow)
- Social media auto-posting
- Event widgets for embedding on other sites
- Multi-language support

---

## 8. Success Metrics

- Number of events created per month
- Event page views
- Calendar subscription rate
- "Add to Calendar" click-through rate
- File attachment download rate
- Admin time to create/publish event (should be < 5 minutes)
- Event discovery rate (list vs. calendar view)
- Association usage rate (% of events linked to pages/posts)

---

## 9. Technical Stack Recommendations

**Frontend**:
- React or Next.js for admin interface
- Calendar component: FullCalendar, react-big-calendar, or similar
- Rich text editor: TipTap, Draft.js, or Quill
- Date picker: react-datepicker or native HTML5

**Backend**:
- RESTful API or GraphQL
- PostgreSQL or MySQL database
- Node.js, Python/Django, or PHP/Laravel

**Libraries**:
- **RRule**: rrule.js (recurrence rules)
- **iCalendar**: ical.js or ics (feed generation)
- **Timezone**: Luxon, date-fns-tz, or moment-timezone
- **File Upload**: Multer, Formidable, or cloud SDK
- **Image Processing**: Sharp, ImageMagick

**Cloud Services**:
- File storage: AWS S3, Cloudflare R2, or similar
- CDN: CloudFront, Cloudflare
- Email (for notifications): SendGrid, AWS SES

---

## 10. Implementation Phases

### Phase 1: Core Functionality (MVP)
- Event CRUD operations
- Basic event list view
- Event detail page
- Publish/unpublish controls
- Single date management

### Phase 2: Advanced Features
- Calendar view
- iCalendar feed/subscription
- Image/video management
- File attachments

### Phase 3: Convenience Features
- Quick date buttons (+7, +30 days)
- RRule date generation
- Event associations
- All-day events

### Phase 4: Polish & Optimization
- Search and filtering
- Bulk actions
- Performance optimization
- Analytics/metrics

---

## Appendix A: Sample Event Data

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Annual Charity Gala",
  "subtitle": "Supporting Local Communities",
  "slug": "annual-charity-gala-2024",
  "location": "Grand Ballroom, City Convention Center, 123 Main St",
  "body": "<p>Join us for an evening of elegance and giving...</p>",
  "startDateTime": "2024-12-15T19:00:00Z",
  "endDateTime": "2024-12-15T23:00:00Z",
  "isAllDay": false,
  "timezone": "America/New_York",
  "status": "published",
  "images": [
    {
      "url": "https://cdn.example.com/events/gala-main.jpg",
      "altText": "Elegantly decorated ballroom",
      "order": 0
    }
  ],
  "video": {
    "url": "https://youtube.com/watch?v=example",
    "type": "youtube"
  },
  "attachments": [
    {
      "fileName": "event-program.pdf",
      "fileUrl": "https://cdn.example.com/events/program.pdf",
      "fileSize": 245632,
      "mimeType": "application/pdf"
    }
  ],
  "associations": {
    "pages": ["about-us-page-id"],
    "blogPosts": ["gala-announcement-post-id"]
  }
}
```

---

## Appendix B: RRule Examples

**Every Tuesday for 10 weeks**:
```
FREQ=WEEKLY;BYDAY=TU;COUNT=10
```

**First Monday of every month**:
```
FREQ=MONTHLY;BYDAY=1MO
```

**Every day for 30 days**:
```
FREQ=DAILY;COUNT=30
```

**Weekly on Monday, Wednesday, Friday until end of year**:
```
FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20241231T235959Z
```

---

## Document Control

- **Version**: 1.0
- **Last Updated**: 2024
- **Owner**: Product Team
- **Status**: Draft for Review

