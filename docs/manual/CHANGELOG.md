# User Manual Changelog

This file tracks all changes made to the user manual documentation. When updating the manual, add an entry here with the date, version, and description of changes.

## Format

Each entry should follow this format:

```markdown
## [Version] - YYYY-MM-DD

### Added
- New sections or features documented

### Changed
- Updates to existing documentation

### Removed
- Sections or content removed

### Fixed
- Corrections to errors or unclear content
```

---

## [1.0.0] - 2024-11-12

### Added
- Initial release of comprehensive user manual
- Complete documentation for all major features:
  - Getting Started guide
  - Dashboard overview
  - Site creation (manual, AI-powered, and duplication methods)
  - Content management with visual editor
  - Product catalog management
  - Events calendar
  - Order management and fulfillment
  - Design customization (colors, fonts, header, footer)
  - Payment setup with Stripe Connect
  - Custom domain configuration with DNS instructions
  - Settings (profile, business, security, notifications)
- Tips & Best Practices section covering:
  - Content creation
  - Product photography
  - Inventory management
  - Customer service
  - Marketing strategies
  - Security best practices
  - Performance optimization
- Quick Reference section with common tasks and keyboard shortcuts
- Glossary of technical terms
- Status indicators and their meanings

### Notes
- Documentation created through comprehensive codebase analysis using specialized subagents
- Focuses on non-technical, user-friendly language
- Covers complete user journey from signup to order fulfillment
- Includes practical tips for plant shop and garden center businesses

---

## How to Update This Changelog

When you make changes to the user manual:

1. **Determine the version number**:
   - **Major version (X.0.0)**: Complete rewrites or major restructuring
   - **Minor version (1.X.0)**: New sections added or significant updates
   - **Patch version (1.0.X)**: Small corrections, clarifications, or minor additions

2. **Add a new entry at the top** (above this section) with:
   - Version number in square brackets
   - Date in YYYY-MM-DD format
   - Categorized list of changes

3. **Categorize your changes**:
   - **Added**: New documentation sections or features
   - **Changed**: Updates to existing content
   - **Removed**: Deleted sections or deprecated features
   - **Fixed**: Corrected errors, typos, or unclear explanations

4. **Be specific**: Describe what changed and why (if relevant)

### Examples

```markdown
## [1.1.0] - 2024-12-01

### Added
- New section on bulk product import via CSV
- Screenshots for payment setup process

### Changed
- Updated Stripe onboarding steps to reflect new UI
- Revised domain configuration instructions for clarity

### Fixed
- Corrected DNS record example values
- Fixed broken internal links in Table of Contents
```

```markdown
## [1.0.1] - 2024-11-20

### Changed
- Updated recommended image dimensions for product photos

### Fixed
- Typo in "Order Management" section
- Clarified difference between Published and Draft status
```

---

## Linking Changes to Code

When platform features change, update the manual and reference the code changes:

```markdown
## [1.2.0] - 2025-01-15

### Added
- Documentation for new inventory forecasting feature (relates to PR #456)

### Changed
- Updated checkout process to reflect new one-page checkout (commit abc123f)

### Removed
- Legacy multi-step checkout documentation (deprecated in v2.0)
```

---

## Review Schedule

The user manual should be reviewed and updated:

- **After each major release**: Ensure all new features are documented
- **Quarterly**: Review for accuracy and clarity
- **When users report confusion**: Update unclear sections based on feedback

---

**Maintained by**: Platform Documentation Team
**Last Review**: 2024-11-12
