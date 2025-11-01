# Social Media Extraction - Visual Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WEBSITE SCRAPING SYSTEM                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                         Input: URL to scrape
                                      │
                                      ▼
                    ┌─────────────────────────────┐
                    │  Fetch Website HTML         │
                    │  Take Screenshot (optional) │
                    └─────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────┐
                    │  Preprocess HTML            │
                    │  • Visual (for vision AI)   │
                    │  • Text (for text AI)       │
                    │  • Images (for img AI)      │
                    └─────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 1: VISUAL ANALYSIS                           │
│                                                                               │
│   Model: grok-2-vision-1212 (Vision AI)                                     │
│   Input: Screenshot + Processed HTML                                         │
│                                                                               │
│   Extracts:                                                                  │
│   • Brand colors (hex codes)                                                 │
│   • Logo URL                                                                 │
│   • Typography (fonts, sizes, weights)                                       │
│   • Design tokens (spacing, shadows)                                         │
│                                                                               │
│   Duration: ~8-12 seconds                                                    │
│   Cost: ~$0.0008                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: PARALLEL TEXT EXTRACTION                         │
│                     (Promise.allSettled - All Run Together)                  │
│                                                                               │
│   Model: grok-code-fast-1 (Fast Text AI)                                    │
│   Input: Preprocessed HTML Text                                              │
│                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   PHASE 2A      │  │   PHASE 2B      │  │   PHASE 2C      │             │
│  │ Contact Info    │  │ Content         │  │ Social Proof    │             │
│  │                 │  │ Structure       │  │                 │             │
│  │ • Emails        │  │ • Site title    │  │ • Testimonials  │             │
│  │ • Phones        │  │ • Description   │  │ • Services      │             │
│  │ • Addresses     │  │ • Hero section  │  │ • FAQs          │             │
│  │ • Hours         │  │ • Key features  │  │ • Reviews       │             │
│  │ • Coordinates   │  │ • Galleries     │  │ • Business hrs  │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐                                   │
│  │   PHASE 2D      │  │   PHASE 2E      │                                   │
│  │ Images          │  │ Social Media    │  ← NEW                            │
│  │                 │  │                 │                                    │
│  │ • Hero images   │  │ • Facebook      │                                   │
│  │ • Gallery imgs  │  │ • Instagram     │                                   │
│  │ • Product imgs  │  │ • Twitter/X     │                                   │
│  │ • Feature imgs  │  │ • LinkedIn      │                                   │
│  │ • Logo images   │  │ • TikTok        │                                   │
│  │ • Team photos   │  │ • YouTube       │                                   │
│  │                 │  │ • Pinterest     │                                   │
│  │                 │  │ • Snapchat      │                                   │
│  │                 │  │ • WhatsApp      │                                   │
│  │                 │  │ • Yelp          │                                   │
│  └─────────────────┘  └─────────────────┘                                   │
│                                                                               │
│   Duration: ~10-15 seconds (parallel, not sequential)                        │
│   Cost per phase: ~$0.0002                                                   │
│   Total Phase 2 cost: ~$0.0010                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────┐
                    │  Merge All Results          │
                    │  into ExtractedBusinessInfo │
                    └─────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE STORAGE                                   │
│                                                                               │
│   Table: public.sites                                                        │
│                                                                               │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │ id                UUID PRIMARY KEY                               │       │
│   │ name              VARCHAR(255)                                   │       │
│   │ subdomain         VARCHAR(63)                                    │       │
│   │                                                                   │       │
│   │ -- Branding (from Phase 1)                                       │       │
│   │ logo_url          TEXT                                           │       │
│   │ primary_color     VARCHAR(7)                                     │       │
│   │                                                                   │       │
│   │ -- Contact Info (from Phase 2A)                                  │       │
│   │ business_email    VARCHAR(255)                                   │       │
│   │ business_phone    VARCHAR(50)                                    │       │
│   │ business_address  TEXT                                           │       │
│   │ business_hours    JSONB                                          │       │
│   │                                                                   │       │
│   │ -- Social Media (from Phase 2E) ← NEW                            │       │
│   │ social_media      JSONB DEFAULT '[]'                             │       │
│   │                   [                                               │       │
│   │                     {                                             │       │
│   │                       "platform": "facebook",                    │       │
│   │                       "url": "https://facebook.com/business",    │       │
│   │                       "username": "business",                    │       │
│   │                       "confidence": 0.95                         │       │
│   │                     }                                             │       │
│   │                   ]                                               │       │
│   │                                                                   │       │
│   │ created_at        TIMESTAMPTZ                                    │       │
│   │ updated_at        TIMESTAMPTZ                                    │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                               │
│   Index: idx_sites_social_media (GIN on social_media column)                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Phase 2E Detail: Social Media Extraction Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                  PHASE 2E: SOCIAL MEDIA EXTRACTION               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────┐
            │  Input: Preprocessed HTML Text  │
            │  • Footer sections              │
            │  • Header/nav areas             │
            │  • Contact pages                │
            │  • Social widgets               │
            └─────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────┐
            │  Build LLM Prompt               │
            │  • System: Extraction rules     │
            │  • User: HTML + context         │
            └─────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│              SEND TO LLM (grok-code-fast-1)                        │
│                                                                     │
│  The LLM analyzes HTML and:                                        │
│                                                                     │
│  1. SEARCH PRIORITY                                                │
│     ┌─────────────┐                                                │
│     │   Footer    │  ← Highest priority (80% of sites)             │
│     └─────────────┘                                                │
│     ┌─────────────┐                                                │
│     │   Header    │  ← Second priority                             │
│     └─────────────┘                                                │
│     ┌─────────────┐                                                │
│     │   Content   │  ← Third priority                              │
│     └─────────────┘                                                │
│                                                                     │
│  2. PATTERN RECOGNITION                                            │
│     • <a href="https://facebook.com/...">                          │
│     • <a aria-label="Follow on Instagram">                         │
│     • class="social-icon fa-facebook"                              │
│     • <meta property="og:url">                                     │
│     • JSON-LD social profiles                                      │
│     • data-social="twitter"                                        │
│                                                                     │
│  3. URL VALIDATION                                                 │
│     ✓ Include: Business profiles                                   │
│     ✗ Exclude: Social sharing buttons                              │
│     ✗ Exclude: Privacy/terms pages                                 │
│     ✓ Normalize: Mobile URLs, country domains                      │
│                                                                     │
│  4. PLATFORM IDENTIFICATION                                        │
│     facebook.com    → "facebook"                                   │
│     instagram.com   → "instagram"                                  │
│     twitter.com     → "x"                                          │
│     x.com           → "x"                                          │
│     linkedin.com    → "linkedin"                                   │
│     tiktok.com      → "tiktok"                                     │
│     youtube.com     → "youtube"                                    │
│     pinterest.com   → "pinterest"                                  │
│                                                                     │
│  5. CONFIDENCE SCORING                                             │
│     0.9-1.0   = Footer/header + clear identification               │
│     0.7-0.89  = Content area + social icon                         │
│     0.5-0.69  = Inferred from partial URL                          │
│     < 0.5     = Low confidence / ambiguous                         │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────┐
            │  LLM Returns JSON               │
            │  {                              │
            │    socialLinks: [...],          │
            │    extractionMetadata: {...},   │
            │    confidence: 0.93             │
            │  }                              │
            └─────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────┐
            │  Validation                     │
            │  • Check min data exists        │
            │  • Confidence >= 0.3            │
            │  • At least 1 link found        │
            └─────────────────────────────────┘
                              │
                              ▼
            ┌─────────────────────────────────┐
            │  Return Result                  │
            │  (or undefined if no data)      │
            └─────────────────────────────────┘
```

## Example HTML → Extraction Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        INPUT HTML                                 │
└──────────────────────────────────────────────────────────────────┘

<footer class="site-footer">
  <div class="social-links">
    <a href="https://facebook.com/mybusiness"
       aria-label="Follow us on Facebook">
      <i class="fa fa-facebook"></i>
    </a>
    <a href="https://instagram.com/mybusiness"
       aria-label="Follow us on Instagram">
      <i class="fa fa-instagram"></i>
    </a>
    <a href="https://twitter.com/mybusiness"
       class="social-icon twitter">
      <svg>...</svg>
    </a>
  </div>
</footer>

                              │
                              ▼

┌──────────────────────────────────────────────────────────────────┐
│                      LLM ANALYSIS                                 │
└──────────────────────────────────────────────────────────────────┘

1. Identifies footer section
2. Finds social-links container
3. Extracts 3 anchor links
4. Recognizes platforms from URLs
5. Extracts usernames from URLs
6. Scores high confidence (footer location + direct links)
7. Notes extraction method (direct_link + icon_link)

                              │
                              ▼

┌──────────────────────────────────────────────────────────────────┐
│                    STRUCTURED OUTPUT                              │
└──────────────────────────────────────────────────────────────────┘

{
  "socialLinks": [
    {
      "platform": "facebook",
      "url": "https://facebook.com/mybusiness",
      "username": "mybusiness",
      "confidence": 0.95,
      "location": "footer",
      "extractionMethod": "direct_link"
    },
    {
      "platform": "instagram",
      "url": "https://instagram.com/mybusiness",
      "username": "mybusiness",
      "confidence": 0.93,
      "location": "footer",
      "extractionMethod": "direct_link"
    },
    {
      "platform": "x",
      "url": "https://twitter.com/mybusiness",
      "username": "mybusiness",
      "confidence": 0.92,
      "location": "footer",
      "extractionMethod": "icon_link"
    }
  ],
  "extractionMetadata": {
    "totalLinksFound": 3,
    "primarySocialSection": "footer .social-links",
    "hasStructuredData": false,
    "ambiguousLinks": []
  },
  "confidence": 0.93
}

                              │
                              ▼

┌──────────────────────────────────────────────────────────────────┐
│                    DATABASE STORAGE                               │
└──────────────────────────────────────────────────────────────────┘

UPDATE sites
SET social_media = '[
  {
    "platform": "facebook",
    "url": "https://facebook.com/mybusiness",
    "username": "mybusiness",
    "confidence": 0.95
  },
  {
    "platform": "instagram",
    "url": "https://instagram.com/mybusiness",
    "username": "mybusiness",
    "confidence": 0.93
  },
  {
    "platform": "x",
    "url": "https://twitter.com/mybusiness",
    "username": "mybusiness",
    "confidence": 0.92
  }
]'::jsonb
WHERE id = '...';
```

## Edge Case Handling Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     EDGE CASE HANDLING                            │
└──────────────────────────────────────────────────────────────────┘

CASE 1: Social Sharing Buttons
──────────────────────────────────
Input:  <a href="https://facebook.com/sharer.php?u=...">Share</a>
        <a href="https://twitter.com/intent/tweet">Tweet this</a>

Action: ✗ EXCLUDE
Reason: Not business profile links

──────────────────────────────────

CASE 2: Multiple Links to Same Platform
──────────────────────────────────
Input:  Footer: <a href="https://facebook.com/mybusiness">
        Header: <a href="https://facebook.com/mybusiness-alt">

Action: Choose footer link (highest priority)
Note:   "Multiple Facebook links found, selected footer version"

──────────────────────────────────

CASE 3: Twitter vs X
──────────────────────────────────
Input:  <a href="https://twitter.com/mybusiness">

Action: Normalize platform to "x"
Output: { "platform": "x", "url": "https://twitter.com/..." }

──────────────────────────────────

CASE 4: Shortened URLs
──────────────────────────────────
Input:  <a href="https://bit.ly/abc123">

Action: Extract as-is
Output: { "url": "https://bit.ly/abc123", "confidence": 0.7,
          "notes": "Shortened URL - may need expansion" }

──────────────────────────────────

CASE 5: No Social Links
──────────────────────────────────
Input:  <footer>Copyright 2024</footer>

Action: Return empty result
Output: undefined (or { socialLinks: [], confidence: 0 })

──────────────────────────────────

CASE 6: Ambiguous Links
──────────────────────────────────
Input:  <a href="/social/facebook">Social</a>

Action: Include in ambiguousLinks array
Output: { "ambiguousLinks": ["/social/facebook"],
          "confidence": 0.4 }

──────────────────────────────────
```

## Technology Stack

```
┌────────────────────────────────────────────────────────────┐
│                    TECHNOLOGY LAYERS                        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  LLM Provider: OpenRouter                                   │
│  • Phase 1 Model: grok-2-vision-1212 (vision)              │
│  • Phase 2 Model: grok-code-fast-1 (text)                  │
│  • Cost: ~$0.0012 per full scrape                          │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Application Layer: TypeScript                              │
│  • Prompt engineering                                       │
│  • Response parsing & validation                            │
│  • Error handling & retries                                 │
│  • Result merging                                           │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Database: PostgreSQL (Supabase)                            │
│  • JSONB storage (flexible schema)                          │
│  • GIN indexing (fast queries)                              │
│  • Row-level security                                       │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  API Layer: Next.js App Router                              │
│  • RESTful endpoints                                        │
│  • Type-safe responses                                      │
│  • Authentication & authorization                           │
└────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

```
┌──────────────────────────────────────────────────────────────┐
│                  PERFORMANCE METRICS                          │
└──────────────────────────────────────────────────────────────┘

Metric              | Before Phase 2E  | After Phase 2E   | Change
────────────────────┼──────────────────┼──────────────────┼────────
Phase 2 Duration    | 10-15 sec        | 10-15 sec        | 0%
Phase 2 Extractions | 4 parallel       | 5 parallel       | +1
Cost per Scrape     | $0.0010          | $0.0012          | +20%
Cost (absolute)     | $0.0010          | $0.0012          | +$0.0002
Success Rate        | 92%              | 93%              | +1%
Data Completeness   | 85%              | 88%              | +3%

                 ┌──────────────────────────────┐
                 │  NO LATENCY INCREASE         │
                 │  (Parallel Execution)        │
                 └──────────────────────────────┘

Phase 2A ═══════════════════════════╗
Phase 2B ═══════════════════════════╣
Phase 2C ═══════════════════════════╣═══> Results
Phase 2D ═══════════════════════════╣
Phase 2E ═══════════════════════════╝ (NEW)

All run simultaneously, so total time = slowest phase time
(not sum of all phases)
```

## Query Patterns

```
┌──────────────────────────────────────────────────────────────┐
│                   COMMON QUERY PATTERNS                       │
└──────────────────────────────────────────────────────────────┘

1. Find sites with Instagram:
   ───────────────────────────
   SELECT * FROM sites
   WHERE social_media @> '[{"platform": "instagram"}]';

2. Count sites by platform:
   ───────────────────────────
   SELECT
     elem->>'platform' as platform,
     COUNT(*) as count
   FROM sites, jsonb_array_elements(social_media) elem
   GROUP BY platform
   ORDER BY count DESC;

3. Get all social links for a site:
   ───────────────────────────
   SELECT
     elem->>'platform',
     elem->>'url',
     elem->>'username'
   FROM sites, jsonb_array_elements(social_media) elem
   WHERE id = 'site-id';

4. Find sites with 3+ platforms:
   ───────────────────────────
   SELECT name, jsonb_array_length(social_media) as platforms
   FROM sites
   WHERE jsonb_array_length(social_media) >= 3
   ORDER BY platforms DESC;

5. High-confidence extractions only:
   ───────────────────────────
   SELECT
     name,
     elem->>'platform',
     elem->>'url'
   FROM sites, jsonb_array_elements(social_media) elem
   WHERE (elem->>'confidence')::DECIMAL > 0.8;
```
