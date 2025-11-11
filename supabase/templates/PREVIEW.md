# Email Template Previews

Visual description of each email template.

## Template Structure (All Emails)

All emails follow this consistent structure:

```
┌────────────────────────────────────────────┐
│ 🌸                                         │  ← Green gradient header
│ Brands & Blooms                            │     with flower icon
├────────────────────────────────────────────┤
│                                            │
│ [Heading]                                  │  ← Dark navy heading
│                                            │
│ [Message copy]                             │  ← Body text
│                                            │
│ ┌──────────────────────────────┐          │
│ │   [Call-to-Action Button]    │          │  ← Green gradient button
│ └──────────────────────────────┘          │
│                                            │
│ ╔════════════════════════════════╗        │
│ ║ ⏰ Link expires in 1 hour      ║        │  ← Security notice box
│ ║ [Additional security info]     ║        │     (color varies by type)
│ ╚════════════════════════════════╝        │
│                                            │
│ ─────────────────────────────────         │  ← Divider
│                                            │
│ Alternative link:                          │  ← Plain text link
│ https://...                                │     for accessibility
│                                            │
│ [Help text]                                │  ← Security note
│                                            │
├────────────────────────────────────────────┤
│ Brands & Blooms Platform                   │  ← Footer (light gray bg)
│ Create beautiful websites that grow...     │
└────────────────────────────────────────────┘
```

---

## 1. Confirmation Email (`confirmation.html`)

**Subject:** Confirm Your Email Address

### Visual Preview

```
┌────────────────────────────────────────────┐
│          🌸                                │
│      Brands & Blooms                       │  ← Green gradient (135deg)
│                                            │     #4A8061 → #7BA98A
├────────────────────────────────────────────┤
│                                            │
│  Welcome to Brands & Blooms! 🎉           │  ← Friendly heading
│                                            │
│  Thank you for signing up! We're excited   │
│  to help you create beautiful websites     │
│  that grow your business.                  │
│                                            │
│  To get started, please confirm your       │
│  email address by clicking the button      │
│  below:                                    │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │  Confirm My Email Address          │   │  ← Primary CTA
│  └────────────────────────────────────┘   │     Green gradient button
│                                            │
│  ╔══════════════════════════════════════╗ │
│  ║ What's waiting for you:              ║ │  ← Highlight box
│  ║ 🌱 Beautiful templates to get        ║ │     Light green bg
│  ║    started quickly                   ║ │     (#F0F7F4)
│  ║ 🎨 Easy customization with           ║ │
│  ║    drag-and-drop tools               ║ │
│  ║ 🚀 Custom domains to grow your brand ║ │
│  ║ 💚 Friendly support whenever you     ║ │
│  ║    need help                         ║ │
│  ╚══════════════════════════════════════╝ │
│                                            │
│  ⏰ This link expires in 1 hour           │
│                                            │
│  ─────────────────────────────────        │
│                                            │
│  If the button doesn't work, copy and     │
│  paste this link into your browser:       │
│  https://...                               │
│                                            │
│  Didn't create an account? You can        │
│  safely ignore this email.                │
│                                            │
├────────────────────────────────────────────┤
│         Brands & Blooms Platform           │
│   Create beautiful websites that grow      │
│          your business                     │
└────────────────────────────────────────────┘
```

**Key Features:**
- Welcoming tone with celebration emoji
- Feature highlights in green box
- Clear expiration notice
- Reassuring help text

**Colors:**
- Header: Green gradient (#4A8061 → #7BA98A)
- Button: Green gradient (#4A8061 → #7BA98A)
- Highlight box: Light green (#F0F7F4)
- Text: Dark navy (#1F2D4A)

---

## 2. Magic Link Email (`magic-link.html`)

**Subject:** Your Magic Link to Sign In

### Visual Preview

```
┌────────────────────────────────────────────┐
│          🌸                                │
│      Brands & Blooms                       │
├────────────────────────────────────────────┤
│                                            │
│  Your Magic Link is Ready                 │  ← Clear heading
│                                            │
│  Click the button below to securely sign   │
│  in to your account. No password needed –  │
│  just one click and you're in!            │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │  Sign In to Your Account           │   │  ← Primary CTA
│  └────────────────────────────────────┘   │
│                                            │
│  ╔══════════════════════════════════════╗ │
│  ║ ⏰ Link expires in 1 hour            ║ │  ← Security notice
│  ║ For your security, this magic link   ║ │     Green left border
│  ║ can only be used once and will       ║ │     (#4A8061)
│  ║ expire soon.                         ║ │
│  ╚══════════════════════════════════════╝ │
│                                            │
│  ─────────────────────────────────        │
│                                            │
│  If the button doesn't work, copy and     │
│  paste this link into your browser:       │
│  https://...                               │
│                                            │
│  Didn't request this link? You can        │
│  safely ignore this email.                │
│                                            │
├────────────────────────────────────────────┤
│         Brands & Blooms Platform           │
│   Create beautiful websites that grow      │
│          your business                     │
└────────────────────────────────────────────┘
```

**Key Features:**
- Explains what a magic link is
- Emphasizes "one click" convenience
- Security-focused notice box
- Green left border on notice

**Colors:**
- Header: Green gradient (#4A8061 → #7BA98A)
- Button: Green gradient (#4A8061 → #7BA98A)
- Notice box: Light gray bg (#F8F9FA), green left border (#4A8061)
- Text: Dark navy (#1F2D4A)

---

## 3. Recovery Email (`recovery.html`)

**Subject:** Reset Your Password

### Visual Preview

```
┌────────────────────────────────────────────┐
│          🌸                                │
│      Brands & Blooms                       │
├────────────────────────────────────────────┤
│                                            │
│  Reset Your Password                       │  ← Direct heading
│                                            │
│  We received a request to reset the        │
│  password for your account. Click the      │
│  button below to create a new password.    │
│                                            │
│  If you didn't request this, you can       │
│  safely ignore this email – your password  │
│  will remain unchanged.                    │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │  Reset My Password                 │   │  ← Primary CTA
│  └────────────────────────────────────┘   │
│                                            │
│  ╔══════════════════════════════════════╗ │
│  ║ 🔒 Security Reminder                 ║ │  ← Security notice
│  ║                                      ║ │     Terracotta border
│  ║ • This link expires in 1 hour        ║ │     (#E87A4B)
│  ║ • The link can only be used once     ║ │     Light peach bg
│  ║ • Never share this email with anyone ║ │     (#FEF7F5)
│  ╚══════════════════════════════════════╝ │
│                                            │
│  ─────────────────────────────────        │
│                                            │
│  If the button doesn't work, copy and     │
│  paste this link into your browser:       │
│  https://...                               │
│                                            │
│  Didn't request a password reset?          │
│  If you didn't make this request, someone  │
│  may be trying to access your account.     │
│  We recommend updating your password       │
│  immediately and enabling two-factor       │
│  authentication.                           │
│                                            │
├────────────────────────────────────────────┤
│         Brands & Blooms Platform           │
│   Create beautiful websites that grow      │
│          your business                     │
└────────────────────────────────────────────┘
```

**Key Features:**
- Clear password reset instructions
- Security-focused with lock icon
- Bulleted security reminders
- Stronger warning about suspicious activity
- Terracotta accent for security emphasis

**Colors:**
- Header: Green gradient (#4A8061 → #7BA98A)
- Button: Green gradient (#4A8061 → #7BA98A)
- Security box: Light peach bg (#FEF7F5), terracotta left border (#E87A4B)
- Text: Dark navy (#1F2D4A)

---

## Responsive Behavior

### Desktop (600px width)
```
┌────────────────────────────────────────────┐
│                                            │
│          [Full width layout]               │
│                                            │
│     [Wide button - 300px centered]         │
│                                            │
└────────────────────────────────────────────┘
```

### Mobile (<600px width)
```
┌──────────────────────┐
│                      │
│  [Stacked layout]    │
│                      │
│ [Full width button]  │
│                      │
└──────────────────────┘
```

**Responsive Features:**
- Email container scales to 100% width on mobile
- Button becomes full-width on narrow screens
- Text reflows naturally
- Touch-friendly tap targets (50px min height)

---

## Dark Mode Behavior

### Light Mode (Default)
```
Background: #FCFCFC (near white)
Container: #FFFFFF (white)
Text: #1F2D4A (dark navy)
Muted: #5A7A6A (gray-green)
```

### Dark Mode (prefers-color-scheme: dark)
```
Background: #1a1a1a (dark gray)
Container: #2d2d2d (lighter dark gray)
Text: #e0e0e0 (light gray)
Muted: #a0a0a0 (medium gray)
Footer: #808080 (gray)
```

**Note:** Green gradient buttons and header remain the same in dark mode for brand consistency.

---

## Email Client Compatibility

### Fully Tested
- ✅ Gmail (web, iOS, Android)
- ✅ Outlook (web, desktop, mobile)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ✅ ProtonMail

### Special Handling

**Outlook (MSO):**
- Uses VML buttons for proper rendering
- Conditional comments ensure compatibility
- Fallback to HTML button for other clients

**Mobile Email Clients:**
- Touch-friendly button size (50px min height)
- Full-width layout under 600px
- Readable font sizes (14px minimum)

**Dark Mode:**
- Graceful degradation if not supported
- Brand colors maintained for consistency
- High contrast ratios for readability

---

## Accessibility Features

### Visual
- High contrast ratios (WCAG AA compliant)
- Minimum font size: 14px
- Clear visual hierarchy
- Color not sole indicator

### Semantic
- Proper HTML structure
- Alt text for emoji/icons
- Descriptive link text
- Role attributes for tables

### Interactive
- Large tap targets (50px buttons)
- Keyboard accessible (email clients handle this)
- Clear focus indicators
- Descriptive CTA text

---

## Brand Voice Examples

### Confirmation Email
- **Tone:** Welcoming, excited, helpful
- **Example:** "Welcome to Brands & Blooms! 🎉"
- **Goal:** Make user feel welcomed and excited

### Magic Link Email
- **Tone:** Friendly, convenient, secure
- **Example:** "No password needed – just one click and you're in!"
- **Goal:** Emphasize convenience and ease

### Recovery Email
- **Tone:** Helpful, secure, reassuring
- **Example:** "We received a request to reset the password for your account."
- **Goal:** Build trust while maintaining security

---

## Technical Specifications

### File Sizes
```
confirmation.html: ~16KB
magic-link.html:   ~12KB
recovery.html:     ~13KB
```

All well under the 102KB email size limit for optimal deliverability.

### Render Time
- Target: <2 seconds to interactive
- No external images (emoji only)
- Inline CSS for instant rendering
- No JavaScript

### Email Standards
- Valid HTML5 (with email-specific elements)
- Inline CSS only
- Table-based layout
- No external dependencies
- UTF-8 encoding

---

## Preview in Browser

To preview templates locally:

```bash
# Open in browser (will show with template variables)
open supabase/templates/confirmation.html
open supabase/templates/magic-link.html
open supabase/templates/recovery.html
```

**Note:** Template variables like `{{ .ConfirmationURL }}` will show as-is in browser. To see actual rendered emails, test through Inbucket or send real emails.

---

## Animation & Interaction

**Static Design:**
- No animations (email clients often block)
- No hover effects (limited support)
- No JavaScript (security restriction)
- Focus on clear, static design

**Interactive Elements:**
- Primary CTA button (hover color slightly lighter in supported clients)
- All links underlined on hover
- Touch-friendly sizing for mobile

---

## Print Styling

If users print emails:
- Clean layout without background colors
- High contrast text
- Links shown in readable format
- No loss of critical information

The templates naturally adapt to print media through browser defaults.