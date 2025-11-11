# Email Templates - Quick Setup Guide

Quick reference for setting up custom email templates in different environments.

## Files Created

```
supabase/templates/
├── confirmation.html       # Email confirmation (sign up)
├── magic-link.html        # Passwordless sign in
├── recovery.html          # Password reset
├── README.md              # Comprehensive documentation
├── TESTING.md             # Testing guide
└── SETUP.md               # This file
```

## Configuration

Templates are already configured in `supabase/config.toml`:

```toml
[auth.email.template.confirmation]
subject = "Confirm Your Email Address"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.magic_link]
subject = "Your Magic Link to Sign In"
content_path = "./supabase/templates/magic-link.html"

[auth.email.template.recovery]
subject = "Reset Your Password"
content_path = "./supabase/templates/recovery.html"
```

## Environment-Specific Setup

### Local Development (Inbucket - Default)

**No setup required!** Templates work out of the box.

```bash
# Start Supabase
pnpm supabase:start

# Access Inbucket to view emails
open http://localhost:54324
```

**Test emails:**
1. Sign up → confirmation email
2. "Sign in with magic link" → magic link email
3. "Forgot password" → recovery email

---

### Local Development (Resend - Production-like)

**1. Get Resend API Key:**
- Sign up at https://resend.com
- Create API key
- Verify sending domain (use `blooms-staging.cc` for testing)

**2. Add to `.env.local`:**
```bash
RESEND_API_KEY=re_your_key_here
```

**3. Enable SMTP in `supabase/config.toml`** (already configured):
```toml
[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 587
user = "resend"
pass = "env(RESEND_API_KEY)"
admin_email = "noreply@blooms-staging.cc"
sender_name = "Brands & Blooms"
```

**4. Restart Supabase:**
```bash
pnpm supabase:restart
```

**5. Test:**
- Use your real email when signing up
- Check your actual inbox
- Verify emails render correctly

---

### Staging Environment

**1. Set Environment Variable:**

In Railway/Vercel/your hosting platform:
```
RESEND_API_KEY=re_your_staging_key_here
```

**2. Configure SMTP in Supabase Dashboard:**
- Project Settings → Auth → SMTP Settings
- Host: `smtp.resend.com`
- Port: `587`
- Username: `resend`
- Password: [Your Resend API Key]
- Sender Email: `noreply@blooms-staging.cc`
- Sender Name: `Brands & Blooms`

**3. Upload Email Templates:**
- Project Settings → Auth → Email Templates
- For each template (Confirmation, Magic Link, Recovery):
  - Click "Edit Template"
  - Paste HTML from corresponding file
  - Update subject line
  - Save

**Templates:**
- Confirmation → `confirmation.html`
- Magic Link → `magic-link.html`
- Recovery → `recovery.html`

---

### Production Environment

**1. Verify Production Domain in Resend:**
- Add `blooms.cc` domain to Resend
- Set up DNS records (SPF, DKIM, DMARC)
- Verify domain

**2. Set Environment Variable:**

In production hosting platform:
```
RESEND_API_KEY=re_your_production_key_here
```

**3. Configure SMTP in Supabase Dashboard:**
- Project Settings → Auth → SMTP Settings
- Host: `smtp.resend.com`
- Port: `587`
- Username: `resend`
- Password: [Your Production Resend API Key]
- Sender Email: `noreply@blooms.cc`  ← Production domain
- Sender Name: `Brands & Blooms`

**4. Upload Email Templates:**

Same as staging - upload the three HTML templates via Supabase Dashboard.

**5. Production Checklist:**
- [ ] Domain verified in Resend
- [ ] DNS records (SPF/DKIM) configured
- [ ] RESEND_API_KEY set in production environment
- [ ] SMTP configured in Supabase Dashboard
- [ ] Email templates uploaded
- [ ] Test all three email types
- [ ] Check spam score (mail-tester.com)
- [ ] Monitor delivery rates

---

## Quick Commands

```bash
# Local Development
pnpm supabase:start          # Start Supabase (Inbucket mode)
pnpm supabase:restart        # Restart (picks up config changes)
pnpm supabase:stop           # Stop Supabase
open http://localhost:54324  # Open Inbucket

# Testing
pnpm dev                     # Start dev server
# Then: Sign up, magic link, or password reset

# Validation
html-validator supabase/templates/*.html  # Validate HTML
```

## Email Provider Options

While these templates are configured for **Resend**, they work with any SMTP provider:

### Resend (Recommended)
- Modern API
- Generous free tier
- Easy domain verification
- Good deliverability

### SendGrid
- Established provider
- More complex setup
- Higher costs

### Mailgun
- Developer-focused
- Good for high volume
- More configuration

### Amazon SES
- Very cheap at scale
- Complex AWS setup
- Requires verification

**To switch providers:** Update the SMTP settings in `supabase/config.toml` or Supabase Dashboard.

## Testing Quick Start

**Fastest way to test:**

```bash
# Terminal 1: Start services
pnpm supabase:start && pnpm dev

# Terminal 2: Open Inbucket
open http://localhost:54324

# Browser: Go to app
open http://localhost:3001

# Test emails:
# 1. Click "Sign Up" → confirmation email
# 2. Click "Sign in with magic link" → magic link email
# 3. Click "Forgot password" → recovery email

# Check Inbucket for emails!
```

## Troubleshooting

### Templates not loading
```bash
# Check config paths are correct
grep "content_path" supabase/config.toml

# Restart Supabase
pnpm supabase:restart
```

### Emails not sending
```bash
# Check Supabase status
pnpm supabase:status

# Check logs
pnpm supabase:logs
```

### SMTP not working
```bash
# Verify API key is set
echo $RESEND_API_KEY

# Check .env.local has RESEND_API_KEY
cat .env.local | grep RESEND

# Restart Supabase after adding env var
pnpm supabase:restart
```

### Wrong domain in emails
```bash
# Update admin_email in supabase/config.toml
# For local/staging: noreply@blooms-staging.cc
# For production: noreply@blooms.cc

# Restart Supabase
pnpm supabase:restart
```

## Brand Customization

To update brand colors in all templates:

**Find and replace** in all three HTML files:

```bash
# Primary green gradient start
#4A8061 → YOUR_COLOR

# Primary green gradient end
#7BA98A → YOUR_COLOR

# Terracotta accent (warnings)
#E87A4B → YOUR_COLOR

# Background
#FCFCFC → YOUR_COLOR

# Text color
#1F2D4A → YOUR_COLOR

# Muted text
#5A7A6A → YOUR_COLOR
```

**After changes:**
1. Validate HTML: `html-validator supabase/templates/*.html`
2. Restart Supabase: `pnpm supabase:restart`
3. Test rendering in multiple email clients

## Support & Documentation

- **Full Documentation**: See `README.md` in this directory
- **Testing Guide**: See `TESTING.md` in this directory
- **Supabase Docs**: https://supabase.com/docs/guides/auth/auth-email-templates
- **Resend Docs**: https://resend.com/docs

## Next Steps

After setup:

1. **Test locally** with Inbucket (easiest)
2. **Test with Resend** (production-like)
3. **Verify rendering** in Gmail, Outlook, Apple Mail
4. **Check spam score** at mail-tester.com
5. **Deploy to staging** and test
6. **Deploy to production** after validation

---

**Quick Win:** The templates are already configured and ready to use with Inbucket. Just run `pnpm supabase:start` and test!