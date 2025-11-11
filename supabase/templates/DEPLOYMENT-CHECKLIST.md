# Email Templates - Production Deployment Checklist

Complete checklist for deploying custom email templates to production.

## Pre-Deployment Checklist

### Local Development Testing

- [ ] **Templates load correctly in local Supabase**
  ```bash
  pnpm supabase:restart
  pnpm dev
  ```

- [ ] **All three email types tested with Inbucket**
  - [ ] Confirmation email (sign up flow)
  - [ ] Magic link email (passwordless sign in)
  - [ ] Recovery email (password reset)

- [ ] **Templates tested with Resend locally**
  - [ ] RESEND_API_KEY set in .env.local
  - [ ] SMTP enabled in config.toml
  - [ ] Emails delivered to real inbox
  - [ ] All links work correctly
  - [ ] No template variable errors

- [ ] **Visual rendering validated**
  - [ ] Gmail (web)
  - [ ] Gmail (mobile - iOS/Android)
  - [ ] Outlook (web)
  - [ ] Apple Mail (macOS/iOS)
  - [ ] Dark mode tested

- [ ] **Content review**
  - [ ] Subject lines are clear
  - [ ] Copy matches brand voice
  - [ ] No typos or grammatical errors
  - [ ] CTAs are action-oriented
  - [ ] Security notices are prominent

- [ ] **Technical validation**
  - [ ] HTML validates (no syntax errors)
  - [ ] Template variables formatted correctly
  - [ ] File sizes under 102KB (confirmed)
  - [ ] No external dependencies
  - [ ] Responsive on mobile (<600px)

---

## Email Provider Setup

### Resend Configuration

- [ ] **Domain setup**
  - [ ] Production domain added to Resend (`blooms.cc`)
  - [ ] DNS records configured:
    - [ ] SPF record added
    - [ ] DKIM records added (usually 2)
    - [ ] DMARC record configured
  - [ ] Domain verification completed in Resend dashboard
  - [ ] Test email sent from domain (deliverability check)

- [ ] **API Key management**
  - [ ] Production API key generated in Resend
  - [ ] Key stored securely (password manager/secrets manager)
  - [ ] Key added to production environment variables
  - [ ] Local/staging keys are separate from production

- [ ] **Sending limits**
  - [ ] Understand Resend rate limits for your plan
  - [ ] Monitor usage doesn't exceed limits
  - [ ] Alerts set up for approaching limits

---

## Staging Environment

### Deploy to Staging First

- [ ] **Environment variables**
  - [ ] RESEND_API_KEY set in staging environment
  - [ ] Value verified (copy/paste errors common)

- [ ] **Supabase Dashboard - SMTP Settings**
  - [ ] Navigate to: Project Settings → Auth → SMTP Settings
  - [ ] SMTP Host: `smtp.resend.com`
  - [ ] Port: `587`
  - [ ] Username: `resend`
  - [ ] Password: [Staging Resend API Key]
  - [ ] Sender Email: `noreply@blooms-staging.cc`
  - [ ] Sender Name: `Brands & Blooms`
  - [ ] **Save and test connection**

- [ ] **Supabase Dashboard - Email Templates**
  - [ ] Navigate to: Project Settings → Auth → Email Templates

  - [ ] **Confirmation Template:**
    - [ ] Click "Edit Template"
    - [ ] Subject: `Confirm Your Email Address`
    - [ ] Paste `confirmation.html` content
    - [ ] Save template
    - [ ] Send test email

  - [ ] **Magic Link Template:**
    - [ ] Click "Edit Template"
    - [ ] Subject: `Your Magic Link to Sign In`
    - [ ] Paste `magic-link.html` content
    - [ ] Save template
    - [ ] Send test email

  - [ ] **Recovery Template:**
    - [ ] Click "Edit Template"
    - [ ] Subject: `Reset Your Password`
    - [ ] Paste `recovery.html` content
    - [ ] Save template
    - [ ] Send test email

- [ ] **Staging testing**
  - [ ] Sign up with real email → confirmation email received
  - [ ] Use magic link sign in → magic link email received
  - [ ] Reset password → recovery email received
  - [ ] All links work and redirect correctly
  - [ ] Emails render correctly in Gmail, Outlook, Apple Mail
  - [ ] Mobile rendering is correct
  - [ ] Dark mode works as expected

- [ ] **Deliverability check**
  - [ ] Send test email to mail-tester.com
  - [ ] Spam score is 8+/10
  - [ ] No critical issues flagged
  - [ ] SPF/DKIM passing

---

## Production Deployment

### Final Production Setup

- [ ] **Environment variables**
  - [ ] RESEND_API_KEY set in production environment
  - [ ] Using production API key (not staging)
  - [ ] Value verified and tested

- [ ] **Supabase Dashboard - Production Project**
  - [ ] Logged into correct project (verify project name)
  - [ ] SMTP Settings configured with production values:
    - [ ] Sender Email: `noreply@blooms.cc` (production domain)
    - [ ] All other settings same as staging
    - [ ] Save and test connection

- [ ] **Email Templates uploaded**
  - [ ] All three templates uploaded to production Supabase
  - [ ] Subject lines match staging
  - [ ] HTML content is identical to tested staging templates
  - [ ] No copy/paste errors or formatting issues

- [ ] **Production testing - Critical**
  - [ ] Create test account with real email
  - [ ] Verify confirmation email:
    - [ ] Email received within 1 minute
    - [ ] Subject line correct
    - [ ] Rendering perfect in Gmail
    - [ ] CTA button works
    - [ ] Link redirects to correct production URL
    - [ ] Email confirmation completes successfully

  - [ ] Test magic link sign in:
    - [ ] Request magic link
    - [ ] Email received quickly
    - [ ] Link works on first click
    - [ ] Single-use verified (link expires after use)

  - [ ] Test password reset:
    - [ ] Request password reset
    - [ ] Email received quickly
    - [ ] Reset link works
    - [ ] Password successfully reset
    - [ ] Link expires after use

- [ ] **Multi-client testing**
  - [ ] Test from Gmail account
  - [ ] Test from Outlook account
  - [ ] Test on mobile device (iOS or Android)
  - [ ] Verify dark mode rendering

---

## Monitoring & Validation

### Post-Deployment Monitoring

- [ ] **Email delivery metrics** (first 24 hours)
  - [ ] Monitor Resend dashboard for:
    - [ ] Delivery rate (target: >99%)
    - [ ] Bounce rate (target: <2%)
    - [ ] Spam complaint rate (target: <0.1%)
  - [ ] Check Supabase logs for email send errors
  - [ ] Verify no user reports of missing emails

- [ ] **Functionality check**
  - [ ] Sign up flow working
  - [ ] Magic link flow working
  - [ ] Password reset flow working
  - [ ] No broken links reported
  - [ ] No template rendering issues

- [ ] **Deliverability monitoring**
  - [ ] Send test emails periodically (daily for first week)
  - [ ] Check inbox placement (Gmail tabs, spam folder)
  - [ ] Monitor for reputation issues in Resend dashboard

---

## Rollback Plan

### If Issues Arise

**Preparation:**
- [ ] Document default Supabase email template settings
- [ ] Have staging environment as fallback
- [ ] Know how to disable custom templates quickly

**Rollback Steps:**

1. **Identify the issue:**
   - Emails not sending?
   - Template rendering broken?
   - Links not working?
   - High bounce/spam rate?

2. **Immediate fix (if templates are broken):**
   - Supabase Dashboard → Auth → Email Templates
   - Revert to default templates (click "Reset to Default")
   - This restores Supabase's built-in templates

3. **Fix SMTP issues:**
   - Check RESEND_API_KEY is correct
   - Verify domain verification in Resend
   - Check Supabase logs for specific errors

4. **Communication:**
   - Notify team of issue and rollback
   - Document what went wrong
   - Plan fix and re-deployment

---

## Success Criteria

Production deployment is successful when:

- [x] **All emails sending reliably** (99%+ delivery rate)
- [x] **Templates render correctly** across major email clients
- [x] **All auth flows work** (sign up, magic link, password reset)
- [x] **Links functional** and redirect to correct pages
- [x] **No increase in bounce/spam rates**
- [x] **Positive user feedback** (or no complaints)
- [x] **Monitoring shows healthy metrics**

---

## Timeline Recommendation

### Suggested Rollout

**Week 1: Local Development**
- Days 1-2: Set up and test locally with Inbucket
- Days 3-4: Test with Resend locally
- Day 5: Multi-client testing and validation

**Week 2: Staging**
- Day 1: Deploy to staging
- Days 2-4: Staging testing and validation
- Day 5: Deliverability testing and refinement

**Week 3: Production**
- Day 1: Deploy to production in morning
- Days 2-3: Monitor closely for issues
- Days 4-5: Gather feedback and adjust if needed

**Week 4: Optimization**
- Monitor long-term metrics
- Adjust based on data
- Document learnings

---

## Emergency Contacts

**Have these ready before deployment:**

- [ ] **Team contacts:**
  - [ ] DevOps lead for environment variables
  - [ ] Product owner for approval
  - [ ] Support team (if emails fail)

- [ ] **Service contacts:**
  - [ ] Resend support email/docs
  - [ ] Supabase support (if needed)

- [ ] **Documentation:**
  - [ ] Link to this checklist
  - [ ] Link to email templates README
  - [ ] Link to testing guide

---

## Post-Launch Tasks

### First Week After Launch

- [ ] **Day 1:**
  - [ ] Monitor email delivery (hourly)
  - [ ] Check for user reports of issues
  - [ ] Verify metrics in Resend dashboard

- [ ] **Day 2-3:**
  - [ ] Continue monitoring (every 4 hours)
  - [ ] Check bounce/spam rates
  - [ ] Gather user feedback

- [ ] **Day 4-7:**
  - [ ] Monitor daily
  - [ ] Document any issues and resolutions
  - [ ] Update templates if needed

### First Month After Launch

- [ ] **Weekly metrics review:**
  - [ ] Delivery rate trends
  - [ ] Bounce rate trends
  - [ ] User feedback summary

- [ ] **Optimization:**
  - [ ] A/B test subject lines (if desired)
  - [ ] Refine copy based on feedback
  - [ ] Update colors/branding if needed

---

## Documentation Updates

After successful deployment:

- [ ] **Update README.md** with any learnings
- [ ] **Document production-specific config**
- [ ] **Update SETUP.md** with production steps
- [ ] **Add troubleshooting** for any issues encountered
- [ ] **Create runbook** for common email issues
- [ ] **Archive this checklist** with completion date

---

## Completion Sign-Off

**Deployed by:** _________________
**Date:** _________________
**Production URL:** _________________
**Staging URL:** _________________

**Post-deployment metrics (7 days):**
- Delivery rate: ________%
- Bounce rate: ________%
- Spam rate: ________%
- User issues reported: ________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Status:** ☐ Successful  ☐ Issues (document below)  ☐ Rolled back

---

## Quick Reference

### Key Files
```
supabase/templates/
├── confirmation.html    # Email confirmation template
├── magic-link.html     # Magic link template
├── recovery.html       # Password reset template
├── README.md           # Full documentation
├── SETUP.md            # Setup instructions
├── TESTING.md          # Testing guide
├── PREVIEW.md          # Visual preview
└── DEPLOYMENT-CHECKLIST.md  # This file
```

### Key Commands
```bash
# Local testing
pnpm supabase:restart      # Restart with new config
pnpm dev                   # Start dev server
open http://localhost:54324  # Open Inbucket

# Validation
html-validator supabase/templates/*.html
```

### Key URLs
- **Resend Dashboard:** https://resend.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com
- **Mail Tester:** https://www.mail-tester.com
- **Inbucket (Local):** http://localhost:54324

---

**Last Updated:** 2025-11-10
**Version:** 1.0.0