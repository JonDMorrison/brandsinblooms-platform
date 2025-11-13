# Production Readiness Plan
## Brands in Blooms Platform

**Generated:** 2025-11-12
**Status:** Action Required
**Priority:** High

---

## Executive Summary

This document outlines a comprehensive, sequential execution plan to prepare the Brands in Blooms platform for production deployment. The plan is organized into phases that can be executed independently by specialized agents, with clear dependencies and verification steps.

**Current State:**
- 866 TypeScript files analyzed
- 20 files with console.log statements identified
- Type safety: Some usage of `any` type detected
- Build configuration: TypeScript and ESLint errors currently ignored
- Security: Basic measures in place, needs hardening

**Critical Findings:**
1. ⚠️ **Build-blocking:** `ignoreBuildErrors` and `ignoreDuringBuilds` enabled in next.config.js
2. ⚠️ **Debug code:** 20+ files with console.log statements
3. ⚠️ **Unused code:** SiteContextRefactored.tsx has no imports (potential unused component)
4. ⚠️ **Type safety:** 59 occurrences of `any` type across 20 files
5. ⚠️ **Comments:** 228 commented code blocks (potential cleanup targets)

---

## Phase 1: Code Quality & Type Safety
**Priority:** Critical
**Agent Type:** `react-frontend-expert` or `code-reviewer`
**Estimated Effort:** 4-6 hours

### 1.1 Remove Debug Code
**Task:** Clean up all console statements and debug artifacts

**Files to clean (20 files identified):**
```
src/components/site-editor/modals/SectionSettingsModal.tsx
src/components/content-editor/editors/shared/FeaturedImageUpload.tsx
src/components/content-editor/editors/shared/CategoryImageUpload.tsx
src/lib/storage/s3-upload.ts
src/lib/queries/domains/theme.ts
src/hooks/useProducts.ts
src/hooks/useProductReviews.ts
src/hooks/useImageUpload.ts
src/hooks/useEvents.ts
src/hooks/useContent.ts
src/contexts/SiteContext.tsx
src/contexts/FullSiteEditorContext.tsx
src/contexts/CartContext.tsx
src/components/site-editor/modals/HeaderSettingsModal.tsx
src/components/site-editor/FullSiteEditorBar.tsx
src/components/site-editor/EditableCustomerSiteSection.tsx
src/components/content/content-columns.tsx
src/components/content-sections/preview/FeaturedPreview.tsx
src/components/auth/SignIn.tsx
tests/e2e/blog-feature.spec.ts
```

**Actions:**
- Remove all `console.log()` statements
- Remove all `console.warn()` statements (except critical startup warnings)
- Remove all `console.error()` statements (replace with proper error handling)
- Keep test file console statements (blog-feature.spec.ts) if needed for debugging

**Exceptions:**
- Keep `console.error()` in src/lib/stripe/config.ts for missing API keys (startup validation)
- Keep `console.error()` in validation-helpers.ts if used for development debugging (wrap in `if (process.env.NODE_ENV === 'development')`)

**Verification:**
```bash
grep -r "console\.(log|warn|error)" src --include="*.ts" --include="*.tsx"
# Should return only whitelisted cases
```

**Success Criteria:**
- Zero console statements in production builds (except whitelisted)
- No runtime console output in browser

---

### 1.2 Fix Type Safety Issues
**Task:** Remove all `any` types and improve type coverage

**Target Files (20 files with `any`):**
```
src/data/plant-content-data.ts:1
src/data/seo-data.ts:5
src/contexts/AdminAuthContext.tsx:2
src/tests/placeholder-implementation.test.tsx:4
src/contexts/AuthModalContext.tsx:1
src/data/plant-shop-content.ts:1
src/types/content-editor.ts:1
src/contexts/AuthContext.tsx:1
src/contexts/AdminImpersonationContext.tsx:2
src/tests/visual-editor/multi-tenant-security.test.ts:6
src/components/WebVitals.tsx:2
src/contexts/SiteContext.tsx:6
src/components/customer-site/CustomerSiteSection.tsx:8
src/components/layout/DashboardSidebar.tsx:2
src/tests/visual-editor/performance-testing.test.tsx:3
src/tests/visual-editor/accessibility-audit.test.tsx:3
src/components/PerformanceMetrics.tsx:1
src/lib/validation/validation-helpers.ts:3
src/tests/visual-editor/browser-compatibility.test.ts:3
src/tests/visual-editor/e2e-workflows.test.tsx:4
```

**Actions:**
- Replace `any` with proper types using `Tables<'table_name'>` from database types
- Use `unknown` with type guards for dynamic data
- Add proper error types using `catch (error: unknown)` pattern
- Leverage `handleError` utility from `@/lib/types/error-handling`

**Verification:**
```bash
pnpm type-coverage
# Target: >95% coverage (currently in CLAUDE.md)
```

**Success Criteria:**
- Zero `any` types in src/ (test files can have limited usage)
- Type coverage >95%
- No TypeScript errors

---

### 1.3 Remove Unused Code
**Task:** Clean up unused components, contexts, and imports

**Identified Issues:**
1. **SiteContextRefactored.tsx** - No imports found, potentially unused
2. **TODO/FIXME comments** - 23 occurrences across 15 files
3. **Commented code blocks** - 228 occurrences across 20+ files
4. **@ts-ignore directives** - 8 occurrences

**Actions:**
- Verify if `SiteContextRefactored.tsx` is truly unused, remove if confirmed
- Review all TODO/FIXME comments:
  - Convert to GitHub issues if still relevant
  - Remove if completed
  - Add timeline if keeping
- Clean up commented code blocks (aggressive removal)
- Remove or fix all `@ts-ignore` and `@ts-nocheck` directives

**Verification:**
```bash
# Find unused exports
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "export" | head -20
# Cross-reference with imports

# Check for remaining issues
grep -r "TODO\|FIXME\|XXX" src --include="*.ts" --include="*.tsx"
grep -r "@ts-ignore\|@ts-nocheck" src --include="*.ts" --include="*.tsx"
```

**Success Criteria:**
- No unused components or contexts
- All TODOs resolved or tracked
- Minimal commented code
- Zero @ts-ignore directives

---

### 1.4 Enable Strict Build Checks
**Task:** Fix TypeScript and ESLint errors, then enable strict checking

**Current State (next.config.js:73-78):**
```javascript
typescript: {
  ignoreBuildErrors: true,  // ⚠️ MUST FIX
},
eslint: {
  ignoreDuringBuilds: true, // ⚠️ MUST FIX
},
```

**Actions:**
1. Run `pnpm typecheck` and fix all errors
2. Run `pnpm lint` and fix all errors
3. Update next.config.js:
   ```javascript
   typescript: {
     ignoreBuildErrors: false,
   },
   eslint: {
     ignoreDuringBuilds: false,
   },
   ```
4. Run `pnpm build` to verify production build succeeds

**Verification:**
```bash
pnpm typecheck    # Should pass with 0 errors
pnpm lint         # Should pass with 0 errors
pnpm build        # Should complete successfully
```

**Success Criteria:**
- All TypeScript errors resolved
- All ESLint errors resolved
- Production build succeeds without warnings
- Strict checks enabled permanently

---

## Phase 2: Security Hardening
**Priority:** Critical
**Agent Type:** `code-reviewer` or `security-expert`
**Estimated Effort:** 3-4 hours

### 2.1 Environment Variable Validation
**Task:** Validate all required environment variables at startup

**Current State:**
- 87 `process.env` accesses across 20 files
- No centralized validation
- Some missing env vars may cause runtime failures

**Actions:**
1. Create `src/lib/env/validation.ts`:
   ```typescript
   import { z } from 'zod'

   const envSchema = z.object({
     // Required
     NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
     NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
     NEXT_PUBLIC_APP_DOMAIN: z.string().min(1),

     // Optional with defaults
     NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
     SITE_CACHE_TYPE: z.enum(['memory', 'redis']).default('memory'),
     // ... add all env vars
   })

   export const env = envSchema.parse(process.env)
   ```

2. Import in `app/layout.tsx` to fail fast on startup
3. Replace all `process.env.X` with `env.X` throughout codebase

**Files with process.env (20 files):**
```
src/lib/stripe/config.ts
src/lib/monitoring/site-analytics.ts
src/lib/cloudflare/config.ts
src/lib/routing/site-routes.ts
src/lib/site/middleware-utils.ts
src/lib/site-editor/edit-session.ts
src/lib/sites/site-creator.ts
src/lib/site-editor/middleware-auto-enable.ts
src/lib/config/scraping.ts
src/lib/site/resolution.ts
src/lib/storage/s3-upload.ts
src/lib/ai/openrouter-client.ts
src/lib/storage/dual-storage-adapter.ts
src/lib/security/multi-domain-security.ts
src/lib/cache/site-cache.ts
src/lib/env/app-domain.ts
src/lib/scraping/debug/html-saver.ts
src/lib/security/site-generation-rate-limit.ts
src/lib/security/content-moderation.ts
src/lib/ai/model-config.ts
```

**Verification:**
```bash
# Start app with missing required env var
unset NEXT_PUBLIC_SUPABASE_URL
pnpm dev
# Should fail immediately with clear error message
```

**Success Criteria:**
- All env vars validated with Zod schema
- App fails fast on missing required vars
- Clear error messages for configuration issues
- No direct `process.env` access in src/

---

### 2.2 Error Boundary Coverage
**Task:** Ensure all user-facing components have error boundaries

**Current State:**
- Multiple ErrorBoundary implementations found:
  - `src/components/ui/error-boundary.tsx`
  - `src/components/ui/plant-shop-error-boundaries.tsx`
  - `src/components/content-editor/ErrorBoundary.tsx`
  - `src/components/content-editor/visual/ErrorBoundary.tsx`

**Actions:**
1. **Consolidate:** Choose ONE error boundary implementation (likely `ui/error-boundary.tsx`)
2. **Remove duplicates:** Delete redundant ErrorBoundary files
3. **Wrap critical components:**
   - All page routes in `app/`
   - Content editor components
   - Customer site rendering
   - Product catalog
   - Checkout flow
4. **Add logging:** Error boundaries should report to monitoring service

**Verification:**
```bash
# Check for multiple ErrorBoundary files
find src -name "*error*boundary*" -o -name "*ErrorBoundary*"

# Verify usage in critical paths
grep -r "ErrorBoundary" app --include="*.tsx"
```

**Success Criteria:**
- Single, reusable ErrorBoundary component
- All critical user paths wrapped
- Errors logged to monitoring service
- User-friendly error messages

---

### 2.3 API Security Review
**Task:** Audit API routes for security vulnerabilities

**Focus Areas:**
1. **Authentication:** All API routes require proper auth checks
2. **Authorization:** Row-level security (RLS) enforced via Supabase
3. **Input validation:** All user inputs validated with Zod schemas
4. **Rate limiting:** Applied to expensive operations
5. **CORS:** Properly configured for allowed origins

**Actions:**
1. Audit all API routes in `app/api/`
2. Verify auth middleware on protected routes
3. Check for direct SQL queries (should use Supabase client)
4. Validate all request bodies with Zod
5. Review CORS configuration in next.config.js

**Verification:**
```bash
# Find all API routes
find app/api -name "route.ts" -o -name "route.tsx"

# Check for auth checks
grep -r "createClient\|auth\|session" app/api --include="*.ts"

# Look for potential SQL injection
grep -r "query\|sql\|execute" app/api --include="*.ts"
```

**Success Criteria:**
- All API routes have auth checks
- No direct SQL queries
- All inputs validated
- Rate limiting on expensive operations
- CORS properly configured

---

### 2.4 Secrets Audit
**Task:** Ensure no secrets in code or version control

**Actions:**
1. Scan for potential secrets:
   ```bash
   grep -r "sk_live_\|pk_live_\|api_key\|secret\|password" src --include="*.ts" --include="*.tsx"
   ```
2. Verify `.env` files are in `.gitignore`
3. Check git history for accidentally committed secrets:
   ```bash
   git log --all --full-history --source -S "sk_live_" -S "api_key" -S "password"
   ```
4. Review `.env.example` - should only have placeholders
5. Ensure Railway env vars are set correctly

**Verification:**
```bash
# Should return zero results for live secrets
grep -r "sk_live_\|whsec_.*[^example]\|re_.*[^example]" src

# Check gitignore
cat .gitignore | grep "\.env"
```

**Success Criteria:**
- No secrets in source code
- No secrets in git history
- All env files properly ignored
- Railway production env vars configured

---

## Phase 3: Performance Optimization
**Priority:** High
**Agent Type:** `nextjs-architect` or `react-frontend-expert`
**Estimated Effort:** 3-4 hours

### 3.1 Bundle Size Analysis
**Task:** Analyze and optimize production bundle size

**Actions:**
1. Run bundle analyzer:
   ```bash
   ANALYZE=true pnpm build
   ```
2. Identify large dependencies (>100KB)
3. Check for duplicate dependencies
4. Verify tree-shaking is working
5. Implement lazy loading for heavy components

**Targets:**
- Remove unused dependencies from package.json
- Lazy load:
  - Rich text editor (TipTap)
  - Design customization components
  - Admin dashboard components
  - Product management forms
- Use dynamic imports for route-specific code

**Verification:**
```bash
# Build and check sizes
pnpm build
# Review .next/analyze output

# Check for duplicate packages
pnpm list --depth=0 | sort | uniq -d
```

**Success Criteria:**
- No duplicate dependencies
- Main bundle <200KB gzipped
- Route-specific chunks <100KB
- Lazy loading implemented for heavy components

---

### 3.2 Image Optimization
**Task:** Ensure all images are optimized and served efficiently

**Current State:**
- next/image configured with WebP format
- CDN configured (localhost:9000 for dev)
- Remote patterns defined for various domains

**Actions:**
1. Audit all `<Image>` component usage:
   ```bash
   grep -r "from 'next/image'\|from \"next/image\"" src --include="*.tsx"
   ```
2. Verify all images use `next/image` (not `<img>`)
3. Add proper `width` and `height` attributes
4. Check for missing `alt` text (accessibility)
5. Verify CDN configuration in production env

**Verification:**
```bash
# Find raw img tags (should be minimal)
grep -r "<img " src --include="*.tsx"

# Check for missing alt text
grep -r "<Image" src --include="*.tsx" | grep -v "alt="
```

**Success Criteria:**
- All images use next/image component
- All images have width/height
- All images have descriptive alt text
- CDN properly configured

---

### 3.3 Database Query Optimization
**Task:** Optimize slow queries and reduce over-fetching

**Actions:**
1. Review all database queries for N+1 patterns
2. Add proper indexes (check `supabase/migrations/`)
3. Implement pagination for large lists
4. Use `select()` to fetch only required columns
5. Add query caching where appropriate

**Focus Areas:**
- Products list (could be large)
- Content list
- User sites list
- Order history
- Analytics queries

**Verification:**
```bash
# Check for potential over-fetching
grep -r "\.select\(\)" src/lib/queries --include="*.ts"
# Should see column lists, not select()

# Check for missing pagination
grep -r "\.limit\|\.range" src/lib/queries --include="*.ts"
```

**Success Criteria:**
- All lists have pagination
- Queries fetch only required columns
- Proper indexes in place
- Query response time <500ms p95

---

## Phase 4: Testing & Monitoring
**Priority:** High
**Agent Type:** `code-reviewer`
**Estimated Effort:** 2-3 hours

### 4.1 Test Coverage
**Task:** Ensure adequate test coverage for critical paths

**Current State:**
- Jest configured
- Playwright E2E tests exist
- Test scripts available

**Actions:**
1. Run test coverage report:
   ```bash
   pnpm test:coverage
   ```
2. Identify untested critical paths:
   - Authentication flows
   - Payment processing
   - Content publishing
   - Site generation
3. Add missing tests (target: >80% coverage)
4. Verify all tests pass:
   ```bash
   pnpm test:all
   pnpm test:e2e
   ```

**Verification:**
```bash
pnpm test:coverage
# Review coverage/index.html
# Target: >80% for critical paths
```

**Success Criteria:**
- >80% test coverage for critical paths
- All tests passing
- E2E tests cover main user journeys
- No focused tests (.only/.skip) in code

---

### 4.2 Error Logging Setup
**Task:** Configure production error logging and monitoring

**Actions:**
1. Choose monitoring service (e.g., Sentry, LogRocket, or Railway logs)
2. Add error tracking to:
   - API routes
   - Error boundaries
   - Critical business logic
3. Configure alerting for critical errors
4. Set up performance monitoring
5. Add user session replay (optional)

**Implementation:**
```typescript
// src/lib/monitoring/error-tracking.ts
export function reportError(error: Error, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production') {
    // Send to monitoring service
  } else {
    console.error('Error:', error, context)
  }
}
```

**Verification:**
- Trigger test error in production
- Verify error appears in monitoring dashboard
- Check alert notifications work

**Success Criteria:**
- Error tracking configured
- Alerts set up for critical errors
- Performance monitoring enabled
- Error rates visible in dashboard

---

### 4.3 Health Check Endpoint
**Task:** Add health check endpoint for deployment monitoring

**Actions:**
1. Create `app/api/health/route.ts`:
   ```typescript
   export async function GET() {
     // Check database connection
     // Check Redis (if used)
     // Check external services

     return Response.json({
       status: 'healthy',
       timestamp: new Date().toISOString(),
       version: process.env.npm_package_version,
       services: {
         database: 'connected',
         cache: 'connected',
       }
     })
   }
   ```
2. Configure Railway health check
3. Add `/api/health` to monitoring

**Verification:**
```bash
curl https://your-domain.com/api/health
# Should return 200 OK with service status
```

**Success Criteria:**
- Health check endpoint responsive
- Railway health check configured
- External monitoring pinging endpoint
- Alerts for health check failures

---

## Phase 5: Deployment Configuration
**Priority:** Critical
**Agent Type:** `backend-architect` or `nextjs-architect`
**Estimated Effort:** 2-3 hours

### 5.1 Production Environment Variables
**Task:** Configure all production environment variables

**Reference:** `.env.example` (lines 219-256)

**Required Production Overrides:**
```bash
# Core
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
NEXT_PUBLIC_APP_DOMAIN=blooms.cc
NEXT_PUBLIC_APP_URL=https://blooms.cc
NODE_ENV=production
NEXT_PUBLIC_ENABLE_DEV_FEATURES=false

# Security
CSRF_PROTECTION=true
CSRF_SECRET_KEY=your-strong-production-secret
RATE_LIMIT_ENABLED=true
SECURITY_HSTS=true
SECURITY_CSP=true

# Storage
R2_ACCOUNT_ID=your-production-r2-account-id
R2_ACCESS_KEY_ID=your-production-r2-access-key
R2_SECRET_ACCESS_KEY=your-production-r2-secret-key
R2_BUCKET_NAME=your-production-bucket-name
NEXT_PUBLIC_CDN_URL=https://your-cdn-domain.com

# Payments
STRIPE_SECRET_KEY=sk_live_your_production_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# Email
RESEND_API_KEY=re_your_production_resend_api_key
SMTP_ADMIN_EMAIL=noreply@blooms.cc

# Cloudflare
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Caching (if using Redis)
REDIS_URL=redis://your-redis-url
SITE_CACHE_TTL_SUBDOMAIN=3600
SITE_CACHE_TTL_CUSTOM_DOMAIN=1800

# Analytics
ANALYTICS_ENABLED=true
ANALYTICS_STORAGE_TYPE=database
ANALYTICS_MAX_EVENTS=50000
```

**Actions:**
1. Audit Railway production environment variables
2. Verify all required vars are set
3. Ensure secrets are stored securely
4. Test production build locally:
   ```bash
   # Load production env vars
   pnpm build
   pnpm start
   ```

**Verification:**
```bash
# Railway CLI
railway variables
# Should list all production vars (values hidden)

# Test locally with production mode
NODE_ENV=production pnpm start
```

**Success Criteria:**
- All required env vars set in Railway
- No placeholder values in production
- Local production build works
- Environment validation passes

---

### 5.2 Database Migration Verification
**Task:** Ensure all migrations are applied in production

**Actions:**
1. Review all migrations:
   ```bash
   ls -la supabase/migrations/
   ```
2. Verify migrations applied in production Supabase
3. Check for pending migrations:
   ```bash
   supabase db status --remote
   ```
4. Apply any pending migrations:
   ```bash
   supabase db push --remote
   ```
5. Backup production database before any changes

**Verification:**
```bash
# Check migration status
supabase db status --remote

# Should show all migrations applied
```

**Success Criteria:**
- All migrations applied
- Database schema matches local
- Backup taken before changes
- RLS policies enabled

---

### 5.3 Seed Data Management
**Task:** Ensure production database has proper initial data

**Current State:**
- Seed script: `scripts/run-seeds.sh`
- Seed file: `supabase/seeds/local-dev-seed.sql`
- ⚠️ Seeds include test data (Soul Bloom Sanctuary)

**Actions:**
1. **Create production seed file:**
   - `supabase/seeds/production-seed.sql`
   - Include only essential data:
     - Product categories
     - Default site settings
     - Initial user roles
   - Exclude test sites and demo products

2. **Update Dockerfile:** Ensure seeds excluded from production:
   ```dockerfile
   # Verify seeds are not copied to production image
   ```

3. **Document seed process:** Add to deployment checklist

**Verification:**
```bash
# Check Dockerfile
cat Dockerfile | grep -i seed

# Production database should NOT have test data
```

**Success Criteria:**
- Production seed file created
- Test data excluded from production
- Essential data included
- Seeds documented

---

### 5.4 SSL/TLS Configuration
**Task:** Verify SSL certificates and HTTPS configuration

**Actions:**
1. Verify Railway auto-SSL is enabled
2. Test all custom domains have valid certificates
3. Configure Cloudflare SSL (if using)
4. Enable HTTP -> HTTPS redirects
5. Test SSL configuration:
   ```bash
   curl -I https://your-domain.com
   # Should show HTTPS with valid certificate
   ```

**Verification:**
```bash
# Test SSL
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check headers
curl -I https://your-domain.com | grep -i "strict-transport-security"
```

**Success Criteria:**
- Valid SSL certificates
- HSTS headers present
- HTTP redirects to HTTPS
- A+ rating on SSL Labs

---

## Phase 6: Documentation & Handoff
**Priority:** Medium
**Agent Type:** `general-purpose`
**Estimated Effort:** 2 hours

### 6.1 Deployment Documentation
**Task:** Document deployment process and production configuration

**Actions:**
1. Create `docs/DEPLOYMENT.md`:
   - Pre-deployment checklist
   - Environment variable setup
   - Migration process
   - Rollback procedure
   - Monitoring setup

2. Update `README.md`:
   - Production requirements
   - Deployment commands
   - Troubleshooting guide

3. Create runbook for common issues:
   - Site not loading
   - Payment failures
   - Email delivery issues
   - Custom domain problems

**Success Criteria:**
- Complete deployment documentation
- Runbook for common issues
- Clear rollback procedure
- Team trained on deployment

---

### 6.2 Performance Baseline
**Task:** Establish performance baselines for monitoring

**Actions:**
1. Run Lighthouse audit on production:
   ```bash
   lighthouse https://your-domain.com --output=html
   ```
2. Document baseline metrics:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)
   - Cumulative Layout Shift (CLS)
   - First Input Delay (FID)

3. Set up performance monitoring alerts

**Target Metrics:**
- FCP: <1.8s
- LCP: <2.5s
- TTI: <3.8s
- CLS: <0.1
- FID: <100ms

**Verification:**
```bash
# Run Lighthouse
lighthouse https://your-domain.com

# Check Core Web Vitals
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://your-domain.com&strategy=mobile"
```

**Success Criteria:**
- Baseline metrics documented
- Performance monitoring configured
- Alerts set for degradation
- All Core Web Vitals in "Good" range

---

### 6.3 Security Checklist
**Task:** Final security review before production

**Checklist:**
- [ ] All secrets in environment variables (not code)
- [ ] CSRF protection enabled
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] Supabase RLS policies enabled
- [ ] Input validation on all API routes
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies up to date (no critical CVEs)
- [ ] Admin routes properly protected
- [ ] File uploads validated and sanitized
- [ ] SQL injection prevented (using Supabase client)
- [ ] XSS prevented (React auto-escaping + CSP)
- [ ] Authentication timeout configured
- [ ] Session management secure

**Actions:**
```bash
# Check for vulnerabilities
pnpm audit --production

# Update dependencies with fixes
pnpm audit fix
```

**Verification:**
- Run security scan
- Manual penetration test
- Code review by security expert

**Success Criteria:**
- All checklist items completed
- No critical vulnerabilities
- Security scan passes
- Penetration test passes

---

## Execution Order & Dependencies

### Critical Path (Must Complete First):
1. **Phase 1.1** - Remove debug code
2. **Phase 1.2** - Fix type safety issues
3. **Phase 1.4** - Enable strict build checks
4. **Phase 2.1** - Environment variable validation
5. **Phase 5.1** - Production environment variables

### Parallel Tracks (Can Run Simultaneously):

**Track A (Code Quality):**
- Phase 1.3 (Unused code)
- Phase 3.1 (Bundle size)
- Phase 3.2 (Image optimization)

**Track B (Security):**
- Phase 2.2 (Error boundaries)
- Phase 2.3 (API security)
- Phase 2.4 (Secrets audit)

**Track C (Infrastructure):**
- Phase 4.1 (Test coverage)
- Phase 4.2 (Error logging)
- Phase 4.3 (Health check)

**Track D (Deployment):**
- Phase 5.2 (Database migrations)
- Phase 5.3 (Seed data)
- Phase 5.4 (SSL/TLS)

### Final Steps (Must Complete Last):
- Phase 3.3 (Database optimization) - after data loaded
- Phase 6.1 (Documentation) - after all technical work
- Phase 6.2 (Performance baseline) - after deployment
- Phase 6.3 (Security checklist) - final gate before launch

---

## Agent Assignment Recommendations

### Phase 1: Code Quality & Type Safety
**Assign to:** `react-frontend-expert`
**Prompt:**
```
Execute Phase 1 of the production readiness plan:
1. Remove all console statements from the 20 identified files
2. Replace all 59 occurrences of `any` type with proper types
3. Remove SiteContextRefactored.tsx if unused
4. Clean up TODO/FIXME comments and commented code
5. Fix all TypeScript and ESLint errors
6. Enable strict build checks in next.config.js

Context: /docs/plans/production-readiness.md
Relevant files: Listed in sections 1.1-1.4
Success criteria: Build passes with strict checks enabled
```

### Phase 2: Security Hardening
**Assign to:** `code-reviewer`
**Prompt:**
```
Execute Phase 2 of the production readiness plan:
1. Create centralized environment variable validation with Zod
2. Replace all process.env accesses with validated env object
3. Consolidate ErrorBoundary implementations to single component
4. Audit all API routes for security issues
5. Scan for secrets in code and git history

Context: /docs/plans/production-readiness.md
Focus: Security vulnerabilities, auth checks, input validation
Success criteria: All API routes secured, no secrets in code
```

### Phase 3: Performance Optimization
**Assign to:** `nextjs-architect`
**Prompt:**
```
Execute Phase 3 of the production readiness plan:
1. Run bundle analyzer and optimize large dependencies
2. Implement lazy loading for heavy components
3. Audit and optimize all image usage
4. Review database queries for N+1 and over-fetching
5. Add proper pagination to large lists

Context: /docs/plans/production-readiness.md
Target: Main bundle <200KB, all images optimized, queries <500ms
Success criteria: Performance targets met, bundle size reduced
```

### Phase 4: Testing & Monitoring
**Assign to:** `code-reviewer`
**Prompt:**
```
Execute Phase 4 of the production readiness plan:
1. Run test coverage report and identify gaps
2. Add tests for critical paths (auth, payments, publishing)
3. Set up error logging and monitoring
4. Create health check endpoint
5. Verify all tests pass

Context: /docs/plans/production-readiness.md
Target: >80% coverage for critical paths
Success criteria: All tests passing, monitoring configured
```

### Phase 5: Deployment Configuration
**Assign to:** `backend-architect`
**Prompt:**
```
Execute Phase 5 of the production readiness plan:
1. Audit and configure all production environment variables
2. Verify database migrations are applied
3. Create production seed file (exclude test data)
4. Configure SSL/TLS and verify certificates
5. Test production build locally

Context: /docs/plans/production-readiness.md
Reference: .env.example lines 219-256
Success criteria: Production environment fully configured and tested
```

### Phase 6: Documentation & Handoff
**Assign to:** `general-purpose`
**Prompt:**
```
Execute Phase 6 of the production readiness plan:
1. Create comprehensive deployment documentation
2. Run Lighthouse audit and document baseline metrics
3. Complete final security checklist
4. Create runbook for common issues
5. Prepare handoff documentation

Context: /docs/plans/production-readiness.md
Target: Complete documentation for deployment and operations
Success criteria: Team can deploy and operate production system
```

---

## Risk Assessment

### High Risk Items (Must Address Before Production):
1. **Build errors ignored** - Could deploy broken code
2. **No environment validation** - Runtime failures from missing config
3. **Debug code in production** - Performance and security issues
4. **Type safety gaps** - Runtime errors from type mismatches
5. **No error monitoring** - Can't detect/respond to production issues

### Medium Risk Items (Should Address):
1. **Large bundle size** - Poor performance on slow connections
2. **Unoptimized queries** - Database performance issues at scale
3. **Missing test coverage** - Hard to maintain and refactor
4. **No health checks** - Can't detect service degradation
5. **Incomplete documentation** - Operational challenges

### Low Risk Items (Nice to Have):
1. **Commented code cleanup** - Code quality issue only
2. **TODO comment cleanup** - Organizational issue
3. **Performance baseline** - Monitoring improvement
4. **Advanced monitoring** - Operational enhancement

---

## Success Metrics

### Pre-Deployment Gates:
- [ ] All Phase 1 tasks complete (build succeeds with strict checks)
- [ ] All Phase 2 tasks complete (security hardened)
- [ ] All Phase 5 tasks complete (production configured)
- [ ] Health check endpoint responding
- [ ] All tests passing
- [ ] Performance targets met
- [ ] Security checklist complete

### Post-Deployment Monitoring:
- Error rate <0.1%
- Response time p95 <500ms
- Uptime >99.9%
- Core Web Vitals all "Good"
- Zero security incidents
- Customer satisfaction >4.5/5

---

## Appendix A: Quick Reference Commands

```bash
# Code Quality
pnpm lint                    # ESLint check
pnpm typecheck               # TypeScript check
pnpm type-coverage           # Type coverage report
pnpm build                   # Production build test

# Testing
pnpm test:all                # All unit tests
pnpm test:e2e                # Playwright E2E tests
pnpm test:coverage           # Coverage report

# Performance
ANALYZE=true pnpm build      # Bundle analyzer
lighthouse https://domain.com # Performance audit

# Security
pnpm audit --production      # Dependency vulnerabilities
grep -r "console\." src      # Find debug statements
grep -r "process\.env" src   # Find env accesses

# Deployment
pnpm supabase:migrate        # Run migrations
railway variables            # Check env vars
railway logs --tail          # Monitor logs
```

---

## Appendix B: Rollback Procedure

If production deployment fails:

1. **Immediate rollback:**
   ```bash
   railway rollback
   # Or via Railway dashboard
   ```

2. **Check logs:**
   ```bash
   railway logs --tail
   ```

3. **Verify database state:**
   ```bash
   supabase db status --remote
   ```

4. **Restore database if needed:**
   ```bash
   # Use latest backup from Supabase dashboard
   ```

5. **Test in staging:**
   - Deploy to staging environment
   - Verify fix before re-deploying to production

6. **Post-mortem:**
   - Document what went wrong
   - Update deployment checklist
   - Add automated check to prevent recurrence

---

## Notes for Agents

**Context Management:**
- Each agent should read the full plan before starting their phase
- Agents should report completion status and any blockers
- Agents should update this document if they discover new issues
- Agents should coordinate on shared files to avoid conflicts

**Decision Authority:**
- Agents can make technical decisions within their phase
- Agents should ask user for approval on breaking changes
- Agents should document all significant decisions
- Agents should flag any security concerns immediately

**Quality Standards:**
- All code must pass lint and typecheck
- All changes must have verification steps
- All critical changes must have tests
- All user-facing changes must be documented

---

**Document Version:** 1.0
**Last Updated:** 2025-11-12
**Next Review:** After Phase 1 completion
