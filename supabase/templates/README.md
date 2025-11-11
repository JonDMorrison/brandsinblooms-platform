# Email Templates Configuration

Custom branded HTML email templates for Brands & Blooms platform authentication emails.

## Overview

This directory contains three branded email templates that match the platform's visual identity:

1. **confirmation.html** - Welcome email with email confirmation link
2. **magic-link.html** - Passwordless sign-in via magic link
3. **recovery.html** - Password reset email

## Design Specifications

### Brand Colors
- **Primary Green**: `#4A8061` (forest green)
- **Primary Gradient**: `linear-gradient(135deg, #4A8061 0%, #7BA98A 100%)`
- **Terracotta Accent**: `#E87A4B` (for warnings/alerts)
- **Background**: `#FCFCFC` (near white)
- **Text**: `#1F2D4A` (dark navy)
- **Muted Text**: `#5A7A6A`

### Email-Safe Features
- Inline CSS (no external stylesheets)
- Table-based layout (best compatibility)
- 600px max width (standard email width)
- Mobile-responsive with media queries
- Dark mode support (`prefers-color-scheme`)
- Alt text for visual elements
- MSO (Outlook) compatibility comments
- Accessible design (WCAG 2.1 AA)

### Template Variables

All templates use Supabase's Go template syntax:

- `{{ .ConfirmationURL }}` - Full URL for the action (confirmation, magic link, or reset)
- `{{ .Token }}` - Token value (for recovery flow)
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Base site URL

## Local Development Setup

### 1. Configuration in config.toml

The templates are already configured in `supabase/config.toml`:

```toml
# Custom branded email templates
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

### 2. Restart Supabase

After making changes to templates or config:

```bash
# Stop local Supabase
pnpm supabase:stop

# Start with fresh config
pnpm supabase:start
```

### 3. Testing with Inbucket (Default Local)

When SMTP is disabled in `config.toml`, emails are captured by Inbucket:

1. **Access Inbucket**: http://localhost:54324
2. **Trigger an email** (sign up, password reset, etc.)
3. **View email** in Inbucket inbox

### 4. Testing with Resend (Production-like)

When SMTP is enabled in `config.toml`:

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

**Requirements:**
- Resend account with API key
- Verified sending domain in Resend
- `RESEND_API_KEY` in `.env.local`

**Testing:**
1. Ensure `RESEND_API_KEY` is set in your environment
2. Restart Supabase: `pnpm supabase:restart`
3. Trigger auth email (sign up, password reset, magic link)
4. Check your actual email inbox or Resend dashboard logs

## Staging/Production Setup

### Supabase Dashboard Configuration

1. **Navigate to**: Project Settings → Auth → Email Templates
2. **For each template type** (Confirmation, Magic Link, Recovery):
   - Click "Edit Template"
   - Paste the HTML from the corresponding file
   - Update subject line
   - Save changes

### Email Provider Setup

In Supabase Dashboard → Project Settings → Auth → SMTP Settings:

```
SMTP Host: smtp.resend.com
Port: 587
Username: resend
Password: [Your Resend API Key]
Sender Email: noreply@blooms.cc
Sender Name: Brands & Blooms
```

**Important**: Use your production verified domain (e.g., `blooms.cc`) for production deployments.

### Environment Variables

Ensure these are set in your deployment platform (Railway, Vercel, etc.):

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

## Testing Guide

### Local Testing Workflow

1. **Start Supabase**:
   ```bash
   pnpm supabase:start
   pnpm dev
   ```

2. **Trigger Test Emails**:
   - **Sign Up**: Create new account → confirmation email
   - **Magic Link**: Use "Sign in with magic link" → magic link email
   - **Password Reset**: Click "Forgot password" → recovery email

3. **Check Email**:
   - **Inbucket**: http://localhost:54324
   - **Resend**: Check inbox or Resend dashboard logs

### Email Client Testing

Test rendering across major email clients:

**Free Tools:**
- [Litmus PutsMail](https://putsmail.com/) - Free email testing
- [MailTrap](https://mailtrap.io/) - Email sandbox (free tier)
- [Temp Mail](https://temp-mail.org/) - Temporary email addresses

**Manual Testing:**
- Gmail (web, mobile)
- Outlook (web, desktop, mobile)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- ProtonMail

**Testing Checklist:**
- ✅ CTA button renders correctly
- ✅ Link is clickable
- ✅ Layout doesn't break
- ✅ Images disabled fallback works
- ✅ Dark mode renders well
- ✅ Mobile responsive (narrow viewport)
- ✅ Text is readable
- ✅ Colors match brand

### Automated Testing

You can test email HTML validity:

```bash
# Install html-validator
npm install -g html-validator-cli

# Validate templates
html-validator supabase/templates/confirmation.html
html-validator supabase/templates/magic-link.html
html-validator supabase/templates/recovery.html
```

## Template Customization

### Updating Colors

All colors are inlined. To change the brand colors:

1. **Find and replace** in all template files:
   - Primary green: `#4A8061` → Your color
   - Gradient end: `#7BA98A` → Your color
   - Accent: `#E87A4B` → Your color

2. **Test across email clients** after changes

### Adding New Templates

1. **Create new HTML file** in `supabase/templates/`
2. **Follow email-safe HTML structure** (see existing templates)
3. **Add to config.toml**:
   ```toml
   [auth.email.template.your_template]
   subject = "Your Subject"
   content_path = "./supabase/templates/your-template.html"
   ```
4. **Restart Supabase** and test

### Email Copy Guidelines

Follow the Brands & Blooms brand voice:

- **Friendly & Approachable**: "We're excited to help you..."
- **Growth-Oriented**: "Start creating beautiful websites..."
- **Clear & Concise**: Get to the point quickly
- **Action-Oriented**: Clear CTAs with benefit-driven copy
- **Reassuring**: Security notices for sensitive actions

## Troubleshooting

### Emails Not Sending

**Check:**
1. Supabase is running: `pnpm supabase:status`
2. Config.toml paths are correct (relative to project root)
3. SMTP credentials are valid (if using Resend)
4. Sending domain is verified in Resend
5. Check Supabase logs: `pnpm supabase:logs`

### Template Not Loading

**Check:**
1. File path in `config.toml` matches actual file location
2. HTML is valid (no syntax errors)
3. Restart Supabase after config changes
4. Check Supabase logs for template parsing errors

### Rendering Issues

**Common Fixes:**
1. **Broken layout**: Ensure all CSS is inline
2. **Button not working**: Check MSO comments for Outlook
3. **Images not showing**: Use emoji fallbacks, not external images
4. **Dark mode broken**: Check media query syntax
5. **Mobile layout broken**: Test with max-width 600px viewport

### Variables Not Replacing

**Check:**
1. Using correct Go template syntax: `{{ .Variable }}`
2. Variable name matches Supabase's expected variables
3. No extra spaces inside curly braces
4. Test with actual auth flow, not just HTML preview

## Production Deployment Checklist

Before going live:

- [ ] Test all three email types in production-like environment
- [ ] Verify sending domain in email provider (Resend, SendGrid, etc.)
- [ ] Update `admin_email` to production domain
- [ ] Test across major email clients (Gmail, Outlook, Apple Mail)
- [ ] Check mobile rendering
- [ ] Test dark mode rendering
- [ ] Verify all links work and redirect correctly
- [ ] Check spam score (use [Mail Tester](https://www.mail-tester.com/))
- [ ] Set up email analytics/tracking if needed
- [ ] Document any production-specific configuration
- [ ] Test rate limiting doesn't break auth flow
- [ ] Verify email deliverability rates

## Resources

### Email Design
- [Email on Acid](https://www.emailonacid.com/) - Email testing platform
- [Litmus](https://www.litmus.com/) - Email testing and analytics
- [Can I Email](https://www.caniemail.com/) - Email client CSS support
- [Really Good Emails](https://reallygoodemails.com/) - Email design inspiration

### Email Development
- [MJML](https://mjml.io/) - Responsive email framework (if switching from HTML)
- [Foundation for Emails](https://get.foundation/emails.html) - Email framework
- [Email Template Guide](https://templates.mailchimp.com/) - Mailchimp's guide

### Testing
- [PutsMail](https://putsmail.com/) - Free email testing
- [MailTrap](https://mailtrap.io/) - Email sandbox
- [Mail Tester](https://www.mail-tester.com/) - Spam score checker

### Supabase Documentation
- [Supabase Auth Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [Go Template Syntax](https://pkg.go.dev/text/template)

## Support

For issues or questions:
1. Check Supabase logs: `pnpm supabase:logs`
2. Review Resend dashboard for delivery issues
3. Test with Inbucket first to isolate email provider issues
4. Validate HTML syntax with online validators
5. Check email client specific rendering issues on Can I Email