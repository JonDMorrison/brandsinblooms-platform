# Resend Email Integration Guide

Complete guide for configuring Resend as the email provider for Supabase Auth emails in the Brands & Blooms platform.

## Table of Contents
- [Overview](#overview)
- [Quick Setup (Local Development)](#quick-setup-local-development)
- [Environment Configuration](#environment-configuration)
- [Testing Email Delivery](#testing-email-delivery)
- [Staging & Production Deployment](#staging--production-deployment)
- [Domain Verification](#domain-verification)
- [Switching Between Resend and Inbucket](#switching-between-resend-and-inbucket)
- [Troubleshooting](#troubleshooting)

## Overview

This platform uses Resend for sending all authentication-related emails:
- Magic link sign-in emails
- Password reset emails
- Email verification emails
- Account confirmation emails

**Current Configuration:**
- **Local Dev**: Uses verified domain (`noreply@blooms-staging.cc`) - Resend SMTP active
- **Staging**: Uses same verified domain (`noreply@blooms-staging.cc`)
- **Production**: Should use `noreply@blooms.cc` (requires domain verification)

**Important Note:** Resend's sandbox/free tier only allows sending emails from verified domains to any recipient. For local development and staging, we use the verified `blooms-staging.cc` domain. Ensure this domain is verified in your Resend account at https://resend.com/domains before testing.

## Quick Setup (Local Development)

### 1. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Navigate to **API Keys** in the dashboard
3. Create a new API key (or use existing one)
4. Copy the API key (format: `re_xxxxx...`)

### 2. Update Environment Variables

Add to your `.env.local` file:

```bash
# Resend API Configuration
RESEND_API_KEY=re_your_api_key_here

# Email sender configuration (for local dev, use Resend test domain)
SMTP_ADMIN_EMAIL=onboarding@resend.dev
SMTP_SENDER_NAME=Brands & Blooms
```

### 3. Restart Supabase

The SMTP configuration is loaded when Supabase starts:

```bash
# Stop Supabase
pnpm supabase:stop

# Start Supabase (loads new config)
pnpm supabase:start
```

**Important**: You must restart Supabase whenever you change email configuration in `supabase/config.toml` or update the `RESEND_API_KEY` environment variable.

### 4. Verify Configuration

Check that Supabase loaded the SMTP config:

```bash
# Check Supabase logs
docker logs supabase_auth_client-brands-in-blooms-platform 2>&1 | grep -i smtp
```

You should see logs indicating SMTP is enabled.

## Environment Configuration

### Configuration Files

**1. `supabase/config.toml`** (lines 196-212)
```toml
[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 587
user = "resend"
pass = "env(RESEND_API_KEY)"
admin_email = "onboarding@resend.dev"  # Change for staging/production
sender_name = "Brands & Blooms"
```

**2. `.env.local`** (Local development)
```bash
RESEND_API_KEY=re_your_api_key_here
SMTP_ADMIN_EMAIL=onboarding@resend.dev
SMTP_SENDER_NAME=Brands & Blooms
```

**3. `.env.example`** (Reference template)
See lines 106-125 for full documentation.

### Environment-Specific Sender Emails

| Environment | Sender Email | Domain Status |
|-------------|--------------|---------------|
| Local | `onboarding@resend.dev` | Resend test domain (no verification needed) |
| Staging | `noreply@blooms-staging.cc` | Requires domain verification |
| Production | `noreply@blooms.cc` | Requires domain verification |

## Testing Email Delivery

### Test Magic Link Sign-In

1. Start your development server:
```bash
pnpm dev
```

2. Navigate to the sign-in page:
```
http://blooms.local:3001/sign-in
```

3. Click "Sign in with magic link" (or similar)

4. Enter your email address and submit

5. Check your email inbox for the magic link

### Expected Email

- **From**: Brands & Blooms <onboarding@resend.dev>
- **Subject**: Magic Link
- **Content**: Contains a link to sign in

### Verify in Resend Dashboard

1. Go to [resend.com/emails](https://resend.com/emails)
2. View recent emails sent
3. Check status (should be "Delivered")
4. View email content and delivery logs

### Test Password Reset

1. Navigate to:
```
http://blooms.local:3001/forgot-password
```

2. Enter email and submit

3. Check your email for password reset link

### Test Sign-Up (if email confirmation enabled)

1. Create a new account
2. Check email for confirmation link

**Note**: By default, `enable_confirmations = false` in `supabase/config.toml` (line 186), so signup emails won't be sent unless you enable this feature.

## Staging & Production Deployment

This guide covers deploying to Supabase Cloud (hosted projects) for staging and production environments.

**Important**: Hosted Supabase projects use the **Dashboard** for SMTP configuration, NOT `supabase/config.toml`. The config.toml file only applies to local development with Supabase CLI.

### Configuration Overview

| Environment | Supabase Type | Config Location | SMTP Config Method |
|-------------|---------------|-----------------|-------------------|
| **Local** | Docker (CLI) | `supabase/config.toml` | config.toml file |
| **Staging** | Cloud (Hosted) | Dashboard + .env.staging | Dashboard only |
| **Production** | Cloud (Hosted) | Dashboard + .env.production | Dashboard only |

### Prerequisites

1. Verified domain in Resend dashboard
2. Production Resend API key
3. Access to Supabase Dashboard for your hosted project
4. Hosting platform access (Railway, Vercel, etc.)

### Step 1: Verify Domain in Resend

1. Go to [resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain:
   - Staging: `blooms-staging.cc`
   - Production: `blooms.cc`
4. Add DNS records (provided by Resend):
   - **SPF Record**: TXT record for sender verification
   - **DKIM Records**: TXT records for email authentication
   - **DMARC Record** (optional): TXT record for policy
5. Wait for verification (usually 1-5 minutes)
6. Confirm domain is "Verified" in dashboard

### Step 2: Create Supabase Cloud Project

If you don't already have a staging/production Supabase project:

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **New Project**
3. Configure project:
   - **Name**: `brands-blooms-staging` (or `brands-blooms-production`)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Select appropriate plan
4. Click **Create new project** (takes 2-3 minutes)

### Step 3: Get Supabase Credentials

Once your project is created:

1. In the Supabase Dashboard, navigate to **Settings** > **API**
2. Copy the following credentials:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (for client-side)
   - **service_role secret**: `eyJhbGc...` (for server-side only!)
3. Navigate to **Settings** > **Database**
4. Copy the **Connection string** (URI format)

**Security Note**: Never commit service_role keys to version control!

### Step 4: Configure SMTP in Supabase Dashboard

Configure SMTP settings for your hosted Supabase project:

1. In the Supabase Dashboard, navigate to **Authentication** > **Email**
2. Scroll down to **SMTP Settings**
3. Toggle **Enable Custom SMTP** to ON
4. Configure the SMTP settings:
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP Username: resend
   SMTP Password: [Your Resend API Key - starts with re_]
   Sender Email: noreply@blooms-staging.cc  (or noreply@blooms.cc for prod)
   Sender Name: Brands & Blooms
   ```
5. Click **Save**
6. Send a test email to verify configuration

**Important**: For hosted Supabase projects (staging/production), you configure SMTP through the dashboard, NOT through `supabase/config.toml`. The config.toml file only applies to local development with Supabase CLI.

### Step 5: Set Environment Variables

Configure environment variables in your hosting platform (Railway, Vercel, etc.):

**For Staging:**
```bash
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres

# Resend configuration
RESEND_API_KEY=re_your_production_api_key
SMTP_ADMIN_EMAIL=noreply@blooms-staging.cc
SMTP_SENDER_NAME=Brands & Blooms

# App configuration
NEXT_PUBLIC_APP_URL=https://blooms-staging.cc
NEXT_PUBLIC_APP_DOMAIN=blooms-staging.cc
```

**For Production:**
```bash
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://yyyyy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:[password]@db.yyyyy.supabase.co:5432/postgres

# Resend configuration
RESEND_API_KEY=re_your_production_api_key
SMTP_ADMIN_EMAIL=noreply@blooms.cc
SMTP_SENDER_NAME=Brands & Blooms

# App configuration
NEXT_PUBLIC_APP_URL=https://blooms.cc
NEXT_PUBLIC_APP_DOMAIN=blooms.cc
```

**Security Notes:**
- Never commit these values to version control
- Use different API keys for staging and production
- Store secrets in your hosting platform's environment variable manager

### Step 6: Run Database Migrations

Apply your local migrations to the staging/production database:

```bash
# Link your Supabase project (one-time setup)
pnpm supabase link --project-ref xxxxx

# Push migrations to remote database
pnpm supabase db push

# Or reset the database (⚠️ destructive - only for initial setup!)
pnpm supabase db reset --db-url "postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres"
```

**Important**: The `db reset` command will delete all data. Only use for initial setup or development databases.

### Step 7: Configure Authentication URLs

Ensure your staging/production URLs are allowed in Supabase Auth:

1. In the Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Set **Site URL**:
   - Staging: `https://blooms-staging.cc`
   - Production: `https://blooms.cc`
3. Add **Redirect URLs** (one per line):
   ```
   https://blooms-staging.cc
   https://blooms-staging.cc/**
   https://*.blooms-staging.cc
   https://*.blooms-staging.cc/**
   https://blooms.cc
   https://blooms.cc/**
   https://*.blooms.cc
   https://*.blooms.cc/**
   ```
4. Click **Save**

**Note**: Wildcard URLs (`*`) allow all customer subdomains (e.g., `customer1.blooms-staging.cc`).

### Step 8: Deploy Application

Deploy your Next.js application to your hosting platform:

**Railway:**
```bash
# Deploy to staging
pnpm deploy:staging

# Deploy to production
pnpm deploy:production
```

**Vercel:**
```bash
# Deploy to staging
vercel --prod --alias staging.blooms-staging.cc

# Deploy to production
vercel --prod --alias blooms.cc
```

### Step 9: Test Email Delivery

After deployment, verify email functionality:

1. Navigate to your staging/production site
2. Go to the sign-in page
3. Click "Sign in with magic link"
4. Enter your email address
5. Check your inbox for the magic link email
6. Verify email in Resend dashboard at https://resend.com/emails

**If emails don't arrive:**
- Check spam/junk folder
- Verify SMTP settings in Supabase Dashboard
- Check Resend logs at https://resend.com/logs
- Verify domain is active in Resend
- Check environment variables are set correctly

## Domain Verification

### DNS Records Required

When you verify a domain in Resend, you'll need to add these DNS records:

#### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
TTL: 3600
```

#### DKIM Records (3 records)
Resend will provide 3 CNAME records like:
```
Type: CNAME
Name: resend._domainkey
Value: resend._domainkey.amazonses.com
TTL: 3600

Type: CNAME
Name: resend2._domainkey
Value: resend2._domainkey.amazonses.com
TTL: 3600

Type: CNAME
Name: resend3._domainkey
Value: resend3._domainkey.amazonses.com
TTL: 3600
```

#### DMARC Record (Optional but Recommended)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
TTL: 3600
```

### Verification Time

- DNS propagation: 1-5 minutes (usually fast)
- Resend verification check: Automatic after DNS propagation
- If verification fails, wait 10-15 minutes and retry

### Domain Status

Check domain status in Resend dashboard:
- **Pending**: DNS records not yet verified
- **Verified**: Ready to send emails
- **Failed**: DNS records incorrect or not found

## Switching Between Resend and Inbucket

You can easily toggle between Resend (real emails) and Inbucket (local email testing) for local development.

### Switch to Inbucket (Local Email Testing)

1. **Comment out SMTP config** in `supabase/config.toml`:
   ```toml
   # [auth.email.smtp]
   # enabled = true
   # host = "smtp.resend.com"
   # port = 587
   # user = "resend"
   # pass = "env(RESEND_API_KEY)"
   # admin_email = "onboarding@resend.dev"
   # sender_name = "Brands & Blooms"
   ```

2. **Restart Supabase**:
   ```bash
   pnpm supabase:stop
   pnpm supabase:start
   ```

3. **View emails in Inbucket**:
   ```
   http://127.0.0.1:54324
   ```

### Switch to Resend (Real Emails)

1. **Uncomment SMTP config** in `supabase/config.toml`:
   ```toml
   [auth.email.smtp]
   enabled = true
   host = "smtp.resend.com"
   port = 587
   user = "resend"
   pass = "env(RESEND_API_KEY)"
   admin_email = "onboarding@resend.dev"
   sender_name = "Brands & Blooms"
   ```

2. **Ensure `.env.local` has Resend API key**:
   ```bash
   RESEND_API_KEY=re_your_api_key_here
   ```

3. **Restart Supabase**:
   ```bash
   pnpm supabase:stop
   pnpm supabase:start
   ```

## Troubleshooting

### Emails Not Sending

**Symptoms**: No email received, no errors in console

**Solutions**:
1. Check Resend API key is correct in `.env.local`
2. Restart Supabase after config changes:
   ```bash
   pnpm supabase:stop
   pnpm supabase:start
   ```
3. Check Supabase logs:
   ```bash
   docker logs supabase_auth_client-brands-in-blooms-platform 2>&1 | grep -i smtp
   ```
4. Verify SMTP is enabled in `supabase/config.toml`
5. Check spam folder
6. Verify domain status in Resend dashboard (for custom domains)

### "Invalid API Key" Error

**Symptoms**: Error in Supabase logs about invalid API key

**Solutions**:
1. Verify API key format: `re_xxxxx...`
2. Check for extra spaces or newlines in `.env.local`
3. Regenerate API key in Resend dashboard
4. Restart Supabase after updating key

### Emails Going to Spam

**Symptoms**: Emails delivered but in spam folder

**Solutions**:
1. Verify all DNS records (SPF, DKIM, DMARC)
2. Use verified domain instead of `onboarding@resend.dev`
3. Check email content and subject line
4. Add domain to allowlist in email client
5. Use consistent sender name and email

### SMTP Connection Timeout

**Symptoms**: "Connection timed out" error in logs

**Solutions**:
1. Check port 587 is not blocked by firewall
2. Verify `smtp.resend.com` is reachable:
   ```bash
   telnet smtp.resend.com 587
   ```
3. Try alternative port (465 with SSL) - update `supabase/config.toml`
4. Check network/proxy settings

### Environment Variable Not Loading

**Symptoms**: Supabase uses wrong/missing API key

**Solutions**:
1. Verify variable name is exactly `RESEND_API_KEY` in `.env.local`
2. Check `env(RESEND_API_KEY)` syntax in `supabase/config.toml`
3. Restart Supabase to reload env vars:
   ```bash
   pnpm supabase:stop
   pnpm supabase:start
   ```
4. Check `.env.local` is in project root
5. Ensure no `.env` file conflicts

### Rate Limiting

**Symptoms**: Some emails send, others fail with rate limit error

**Solutions**:
1. Check Resend plan limits (emails per day/month)
2. Increase `max_frequency` in `supabase/config.toml` (line 190)
3. Implement email queuing for high-volume scenarios
4. Upgrade Resend plan if needed

### Magic Link Not Working

**Symptoms**: Email received, but clicking link shows error

**Solutions**:
1. Check redirect URLs in Supabase dashboard
2. Verify `emailRedirectTo` in `src/lib/auth/client.ts` (line 140)
3. Check link hasn't expired (default: 1 hour)
4. Test with fresh link (old links invalid after use)
5. Check browser console for errors

## Email Rate Limits

### Supabase Rate Limits

Configured in `supabase/config.toml` (line 159):
```toml
[auth.rate_limit]
email_sent = 2  # Emails per hour per user
```

To increase for development, update this value and restart Supabase.

### Resend Rate Limits

Depends on your plan:
- **Free**: 100 emails/day, 3,000/month
- **Pro**: 50,000 emails/month
- **Enterprise**: Custom limits

Check current usage at [resend.com/usage](https://resend.com/usage)

## Email Templates (Optional)

To customize email templates, uncomment in `supabase/config.toml` (line 214):

```toml
[auth.email.template.invite]
subject = "You have been invited"
content_path = "./supabase/templates/invite.html"

[auth.email.template.magic_link]
subject = "Your Magic Link"
content_path = "./supabase/templates/magic-link.html"

[auth.email.template.recovery]
subject = "Reset your password"
content_path = "./supabase/templates/recovery.html"
```

Create template files in `supabase/templates/` directory with HTML content.

## Support & Resources

- **Resend Documentation**: https://resend.com/docs
- **Supabase Auth SMTP Guide**: https://supabase.com/docs/guides/auth/auth-smtp
- **Resend Support**: support@resend.com
- **Project Issues**: [GitHub Issues](https://github.com/your-org/your-repo/issues)

## Security Best Practices

1. **Never commit API keys** - Keep `.env.local` gitignored
2. **Use environment variables** - Always use `env()` syntax in config files
3. **Rotate API keys regularly** - Update every 90 days
4. **Use verified domains** - Don't use test domain in production
5. **Enable DMARC** - Protects against email spoofing
6. **Monitor email logs** - Check Resend dashboard regularly
7. **Separate API keys** - Use different keys for dev/staging/production

## Next Steps

After completing setup:

1. Test all email flows (magic link, password reset, etc.)
2. Verify emails in Resend dashboard
3. Set up domain verification for staging/production
4. Configure production SMTP in Supabase dashboard
5. Document any custom email templates
6. Set up monitoring/alerts for email delivery

---

**Last Updated**: 2025-11-10
**Author**: Brands & Blooms Team
**Version**: 1.0
