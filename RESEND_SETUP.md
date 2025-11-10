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
- **Local Dev**: Uses verified domain (`noreply@clustera.io`) - Resend SMTP active
- **Staging**: Should use `noreply@blooms-staging.cc` (requires domain verification)
- **Production**: Should use `noreply@blooms.cc` (requires domain verification)

**Important Note:** Resend's sandbox/free tier only allows sending emails from verified domains to any recipient, or from the test domain (`onboarding@resend.dev`) to the verified account owner email only. For local development, we use the verified `clustera.io` domain.

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

### Prerequisites

1. Verified domain in Resend dashboard
2. Production Resend API key
3. Access to Supabase Dashboard for your hosted project

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

### Step 2: Configure Supabase Dashboard (Hosted Project)

For staging and production, configure SMTP in your Supabase project dashboard:

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project (staging or production)
3. Navigate to **Authentication** > **Email**
4. Scroll to **SMTP Settings**
5. Configure:
   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP Username: resend
   SMTP Password: [Your Resend API Key]
   Sender Email: noreply@blooms-staging.cc  (or blooms.cc for prod)
   Sender Name: Brands & Blooms
   ```
6. Click **Save**

**Important**: For hosted Supabase projects (staging/production), you configure SMTP through the dashboard, NOT through `supabase/config.toml`. The config.toml file only applies to local development.

### Step 3: Set Environment Variables

In your hosting platform (Railway, Vercel, etc.), set:

```bash
# Staging
RESEND_API_KEY=re_your_production_api_key
SMTP_ADMIN_EMAIL=noreply@blooms-staging.cc
SMTP_SENDER_NAME=Brands & Blooms

# Production
RESEND_API_KEY=re_your_production_api_key
SMTP_ADMIN_EMAIL=noreply@blooms.cc
SMTP_SENDER_NAME=Brands & Blooms
```

### Step 4: Test Production Emails

1. Deploy your application
2. Test magic link sign-in on staging/production
3. Verify emails in Resend dashboard
4. Check spam folder if emails don't arrive

### Step 5: Update Supabase Redirect URLs

Ensure your production URLs are allowed in Supabase Auth:

1. Go to **Authentication** > **URL Configuration**
2. Add redirect URLs:
   ```
   https://blooms-staging.cc
   https://*.blooms-staging.cc
   https://blooms.cc
   https://*.blooms.cc
   ```

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
