# Email Template Testing Guide

Quick reference for testing custom email templates locally and in production.

## Quick Start

### 1. Local Testing with Inbucket (Recommended for Development)

```bash
# Start Supabase (Inbucket runs automatically)
pnpm supabase:start

# Start dev server
pnpm dev

# Access Inbucket
open http://localhost:54324
```

**Trigger test emails:**
1. Navigate to http://localhost:3001
2. Click "Sign Up" and create test account
3. Check Inbucket inbox for confirmation email
4. Click "Sign in with magic link" for magic link test
5. Click "Forgot password" for recovery email test

### 2. Local Testing with Resend (Production-like)

**Setup:**
```bash
# Add to .env.local
echo "RESEND_API_KEY=re_your_key_here" >> .env.local

# Verify SMTP is enabled in supabase/config.toml
# (Already configured - see lines 201-211)

# Restart Supabase to apply changes
pnpm supabase:restart
```

**Test:**
1. Use your real email address when signing up
2. Check your actual inbox for emails
3. Verify rendering in your email client

## Testing Checklist

### Visual Testing

Test each email type in multiple clients:

#### Gmail
- [ ] Desktop web interface
- [ ] Mobile app (iOS/Android)
- [ ] Dark mode rendering

#### Outlook
- [ ] Web interface (outlook.com)
- [ ] Desktop app (Windows/Mac)
- [ ] Mobile app

#### Apple Mail
- [ ] macOS app
- [ ] iOS app
- [ ] Dark mode rendering

#### Other Clients
- [ ] Yahoo Mail
- [ ] ProtonMail
- [ ] Mobile preview (narrow viewport)

### Functional Testing

For each email type, verify:

- [ ] **Subject line** displays correctly
- [ ] **CTA button** is prominent and clickable
- [ ] **Link works** and redirects to correct page
- [ ] **Copy is clear** and matches brand voice
- [ ] **Expiration notice** is visible
- [ ] **Footer** displays correctly
- [ ] **Alternative link** (text version) works
- [ ] **Images disabled**: Layout still works with flower emoji
- [ ] **Dark mode**: Colors are readable
- [ ] **Mobile**: Layout adapts to narrow viewport

### Accessibility Testing

- [ ] Alt text present for visual elements
- [ ] High contrast ratios (WCAG AA minimum)
- [ ] Semantic HTML structure
- [ ] Links have descriptive text
- [ ] Button text is clear and actionable
- [ ] Text size is readable (14px minimum)

### Email Client Compatibility

Test for these common issues:

#### Outlook-Specific
- [ ] MSO conditional comments render correctly
- [ ] Button displays as button (not broken)
- [ ] Layout doesn't shift or break
- [ ] Padding and margins preserved

#### Mobile Email Clients
- [ ] Taps on button are easy (50px min height)
- [ ] Text is readable without zooming
- [ ] Link text doesn't break awkwardly
- [ ] Horizontal scrolling not required

## Testing Tools

### Free Email Testing Services

**PutsMail** (Recommended)
```
URL: https://putsmail.com/
1. Paste HTML template
2. Add your email address
3. Send test
4. Check inbox
```

**MailTrap** (Sandbox)
```
URL: https://mailtrap.io/
- Free tier includes 500 emails/month
- Test all emails in sandbox
- Preview across 90+ email clients
```

**Temp Mail** (Quick Tests)
```
URL: https://temp-mail.org/
- Generate temporary email
- Use for quick signup tests
- Inbox accessible in browser
```

### HTML Validation

Validate email HTML structure:

```bash
# Install validator
npm install -g html-validator-cli

# Validate all templates
html-validator supabase/templates/*.html
```

### Spam Score Testing

Check if emails might be flagged as spam:

```
URL: https://www.mail-tester.com/

1. Send test email to provided address
2. View spam score and issues
3. Fix any flagged problems
4. Re-test until score is 8+/10
```

## Common Issues & Fixes

### Issue: Button not rendering in Outlook

**Cause:** MSO conditional comments not working

**Fix:** Verify this syntax in button code:
```html
<!--[if mso]>
<v:roundrect ... fillcolor="#4A8061">
  <center>Button Text</center>
</v:roundrect>
<![endif]-->
```

### Issue: Layout breaks on mobile

**Cause:** Fixed widths or missing responsive styles

**Fix:** Ensure media query is present:
```css
@media only screen and (max-width: 600px) {
    .email-container { width: 100% !important; }
}
```

### Issue: Dark mode colors unreadable

**Cause:** Colors don't have dark mode overrides

**Fix:** Check dark mode media query:
```css
@media (prefers-color-scheme: dark) {
    .content-text { color: #e0e0e0 !important; }
}
```

### Issue: Link not working

**Cause:** Template variable not being replaced

**Fix:** Verify Go template syntax:
```html
<!-- Correct -->
{{ .ConfirmationURL }}

<!-- Incorrect -->
{{.ConfirmationURL}}  <!-- Missing spaces -->
{ { .ConfirmationURL } }  <!-- Extra spaces -->
```

### Issue: Images not showing

**Cause:** External images blocked by email client

**Fix:** We use emoji fallbacks (🌸), but if adding images:
```html
<img src="data:image/png;base64,..." alt="Fallback text" />
```

### Issue: Emails going to spam

**Common causes:**
- Missing SPF/DKIM records
- Low sender reputation
- Spammy subject lines
- No plain text version
- Too many links

**Fix:**
1. Verify domain in email provider
2. Set up SPF/DKIM/DMARC records
3. Use clear, professional subject lines
4. Test spam score at mail-tester.com

## Testing Workflow

### Before Committing Changes

```bash
# 1. Validate HTML
html-validator supabase/templates/*.html

# 2. Start local Supabase
pnpm supabase:restart

# 3. Test each email type
# - Sign up (confirmation)
# - Magic link (passwordless)
# - Password reset (recovery)

# 4. Check Inbucket
open http://localhost:54324

# 5. Verify rendering
# - Layout intact
# - Button works
# - Copy is correct
# - Links work
```

### Before Production Deploy

```bash
# 1. Test with real email provider (Resend)
# Enable SMTP in config.toml
pnpm supabase:restart

# 2. Send to your email
# Test all three email types

# 3. Check rendering in:
# - Gmail (web + mobile)
# - Outlook (web)
# - Apple Mail (if available)

# 4. Test spam score
# Send to mail-tester.com address

# 5. Verify production config
# - Domain verified in Resend
# - RESEND_API_KEY in production env
# - admin_email set to production domain
```

## Automated Testing Scripts

### Test All Templates Locally

Create `test-emails.sh` (optional):

```bash
#!/bin/bash

echo "Testing email templates locally..."

# Start Supabase if not running
pnpm supabase:start

# Open Inbucket
open http://localhost:54324

# Open dev server
pnpm dev &

echo "✓ Supabase started"
echo "✓ Inbucket open at http://localhost:54324"
echo "✓ Dev server starting..."
echo ""
echo "To test emails:"
echo "1. Go to http://localhost:3001"
echo "2. Sign up for new account (confirmation email)"
echo "3. Click 'Sign in with magic link' (magic link email)"
echo "4. Click 'Forgot password' (recovery email)"
echo ""
echo "Check emails in Inbucket!"
```

### CI/CD Testing (Future)

For automated testing in CI pipeline:

```yaml
# .github/workflows/test-emails.yml
name: Test Email Templates

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Validate HTML
        run: |
          npm install -g html-validator-cli
          html-validator supabase/templates/*.html

      - name: Check template variables
        run: |
          # Ensure all templates use correct Go template syntax
          grep -r "{{ \." supabase/templates/*.html
```

## Performance Testing

### Email Size Check

Emails should be under 102KB for best deliverability:

```bash
# Check file sizes
ls -lh supabase/templates/*.html

# Should see sizes like:
# 12K magic-link.html
# 13K recovery.html
# 16K confirmation.html
```

All templates are well under the limit.

### Load Time Testing

Test how fast emails render:

1. Send test email to yourself
2. Use browser DevTools (Network tab)
3. Check:
   - Time to interactive
   - Image load times (we use emoji, so instant)
   - Total render time

Target: Under 2 seconds for full render

## Production Monitoring

### Email Delivery Monitoring

Track these metrics in your email provider dashboard:

- **Delivery rate**: Target >99%
- **Open rate**: Track for engagement (optional)
- **Bounce rate**: Should be <2%
- **Spam complaints**: Should be <0.1%

### Supabase Dashboard

Monitor in Supabase Dashboard → Logs:

```
Filter by: auth.email
Look for:
- Successful sends
- Failed sends (investigate immediately)
- Template errors
```

### Error Tracking

Common errors to monitor:

- Template parsing errors
- SMTP connection failures
- Invalid recipient emails
- Rate limiting issues

## Resources

### Quick Links
- [Inbucket (Local)](http://localhost:54324) - Local email testing
- [PutsMail](https://putsmail.com/) - Free email testing
- [Mail Tester](https://www.mail-tester.com/) - Spam score
- [Can I Email](https://www.caniemail.com/) - CSS support reference

### Documentation
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Resend Documentation](https://resend.com/docs)
- [Email Design Best Practices](https://www.campaignmonitor.com/dev-resources/)

### Tools
- [HTML Email Check](https://www.htmlemailcheck.com/) - Free client testing
- [Litmus](https://www.litmus.com/) - Professional testing (paid)
- [Email on Acid](https://www.emailonacid.com/) - Professional testing (paid)