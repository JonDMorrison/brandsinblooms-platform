# User Manual Documentation

This directory contains end-user documentation for the Brands in Blooms Platform.

## Contents

- **[user-guide.md](./user-guide.md)** - Complete user manual covering all platform features
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes to the manual

## Purpose

The user manual is designed to:

- Help new users get started with the platform
- Provide step-by-step instructions for common tasks
- Explain all features in non-technical, accessible language
- Serve as a reference guide for site owners and administrators

## Target Audience

- **Primary**: Site owners managing plant shops, garden centers, and botanical businesses
- **Secondary**: Site editors and administrators
- **Not for**: Developers or system administrators (see main project README.md for technical docs)

## How to Use

### For End Users

1. Start with the **Getting Started** section in [user-guide.md](./user-guide.md)
2. Use the **Table of Contents** to find specific topics
3. Refer to **Quick Reference** for common tasks
4. Check the **Glossary** for unfamiliar terms

### For Documentation Maintainers

When platform features change:

1. **Update the user manual** ([user-guide.md](./user-guide.md))
   - Add new sections for new features
   - Update existing sections for changed functionality
   - Remove or mark deprecated features
   - Update screenshots if applicable

2. **Document the change** in [CHANGELOG.md](./CHANGELOG.md)
   - Add entry at the top with date and version
   - Categorize changes (Added, Changed, Removed, Fixed)
   - Increment version number appropriately

3. **Review for clarity**
   - Use simple, non-technical language
   - Include examples and practical tips
   - Test instructions by following them yourself
   - Ask a non-technical person to review if possible

## Version Numbering

- **Major (X.0.0)**: Complete rewrites, major restructuring
- **Minor (1.X.0)**: New sections, significant additions
- **Patch (1.0.X)**: Small corrections, clarifications

Current version: **1.0.0**

## Style Guidelines

### Writing Style

- **Clear and concise**: Avoid jargon and technical terms
- **Action-oriented**: Use imperative verbs ("Click the button" not "The button can be clicked")
- **Step-by-step**: Break complex tasks into numbered steps
- **Visual**: Describe what users will see on screen
- **Helpful**: Include tips, warnings, and best practices

### Formatting

- **Headings**: Use hierarchy (H2 for sections, H3 for subsections)
- **Lists**: Use for steps, options, or multiple items
- **Bold**: Highlight UI elements ("Click **Create Product**")
- **Code blocks**: For technical values (DNS records, SKUs)
- **Tables**: For quick reference and comparisons
- **Examples**: Show real-world scenarios

### Terminology

Use consistent terms throughout:

- **Site** (not website, portal, or app)
- **Dashboard** (not admin panel or control panel)
- **Product** (not item or listing)
- **Order** (not purchase or transaction)
- **Customer** (not user or client, when referring to end shoppers)
- **Content** (for pages and blog posts)
- **Visual Editor** (for the WYSIWYG editor)

## Maintenance Schedule

- **After major releases**: Update for new features
- **Quarterly**: Review for accuracy
- **As needed**: Fix errors or unclear sections based on user feedback

## Contributing

If you're updating the manual:

1. Read existing content to match tone and style
2. Test all instructions before documenting
3. Update the CHANGELOG.md
4. Consider adding screenshots for complex steps (future enhancement)
5. Review for spelling, grammar, and clarity

## Future Enhancements

Planned improvements to the documentation:

- [ ] Add screenshots for visual reference
- [ ] Create video tutorials for complex workflows
- [ ] Develop quick-start guide (condensed version)
- [ ] Add FAQ section based on common support questions
- [ ] Create printable PDF version
- [ ] Add interactive demos or walkthroughs
- [ ] Translate to multiple languages
- [ ] Create role-specific guides (admin vs. editor)

## Feedback

User feedback helps improve documentation:

- Note frequently asked questions (add to FAQ)
- Track which sections cause confusion (rewrite for clarity)
- Identify missing documentation (add new sections)
- Update based on feature requests (explain workarounds)

## Related Documentation

- **Technical Documentation**: `/README.md` - For developers
- **API Documentation**: (if applicable)
- **Database Schema**: `/supabase/migrations/` - For technical reference
- **Architecture Docs**: (if applicable)

---

**Maintained by**: Platform Documentation Team
**Last Updated**: 2024-11-12
**Current Version**: 1.0.0
