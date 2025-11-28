import { ContentSection, createDefaultSection, TextMediaData } from '@/src/lib/content/sections'

export interface HomeTemplateOptions {
    siteName?: string
    primaryCtaUrl?: string
    scheduleCallUrl?: string
    blogSlug?: string
}

export function createAgSitesHomeContent(options: HomeTemplateOptions = {}) {
    const {
        siteName = 'AG Sites',
        primaryCtaUrl = '/schedule',
        scheduleCallUrl = '/schedule',
        blogSlug = '/blog'
    } = options

    const sections: ContentSection[] = []

    // 1. Hero (TextMedia configured as Hero)
    const heroSection = createDefaultSection('textMedia')
    const heroData = heroSection.data as TextMediaData
    heroData.title = 'You deserve a website that actually works.'
    heroData.subtitle = 'GROW YOUR BUSINESS'
    heroData.body = '<p>We help you grow your business with a clear, modern site that converts visitors into customers. Stop losing leads to confusing design.</p>'
    heroData.button = {
        label: 'Schedule a Call',
        url: scheduleCallUrl,
        style: 'primary'
    }
    heroData.layout = 'imageRight'
    heroData.background = 'highlight'
    // Placeholder image - in a real app this would be a specific asset
    heroData.image = {
        url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426',
        alt: 'Modern website dashboard'
    }
    sections.push(heroSection)

    // 2. Problem Cards (Features Grid)
    const problemSection = createDefaultSection('featuresGrid')
    problemSection.data.headline = 'Is your website holding you back?'
    problemSection.data.columns = 3
    problemSection.data.items = [
        {
            title: 'Losing Leads',
            description: 'Visitors leave in seconds because they can\'t find what they need or understand what you do.',
            icon: 'UserMinus'
        },
        {
            title: 'Hard to Update',
            description: 'You feel stuck because you need to pay a developer for every small text change.',
            icon: 'Lock'
        },
        {
            title: 'Invisible on Google',
            description: 'Your beautiful site doesn\'t show up when customers search for your services.',
            icon: 'SearchX'
        }
    ]
    problemSection.settings = { ...problemSection.settings, backgroundColor: 'default' }
    sections.push(problemSection)

    // 3. Promise / Solution (TextMedia)
    const solutionSection = createDefaultSection('textMedia')
    const solutionData = solutionSection.data as TextMediaData
    solutionData.title = 'A clear, modern site that grows your business.'
    solutionData.subtitle = 'THE SOLUTION'
    solutionData.body = '<p>Imagine a website that works as hard as you do. One that tells your story clearly, looks great on every device, and turns visitors into loyal customers automatically.</p>'
    solutionData.layout = 'imageLeft'
    solutionData.background = 'muted'
    solutionData.image = {
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2370',
        alt: 'Analytics and growth'
    }
    solutionData.button = {
        label: 'See How It Works',
        url: '#how-it-works',
        style: 'secondary'
    }
    sections.push(solutionSection)

    // 4. 3-Step Plan (Content Columns / Steps)
    // Using contentColumns to simulate steps
    const planSection = createDefaultSection('contentColumns')
    planSection.data.headline = 'Your path to a better website'
    planSection.data.columns = 3
    planSection.data.items = [
        {
            headline: '1. Book a Call',
            content: '<p>We\'ll discuss your goals, your audience, and what you need your site to do.</p>'
        },
        {
            headline: '2. We Build It',
            content: '<p>Our team creates a custom, high-performance site tailored to your brand.</p>'
        },
        {
            headline: '3. Launch & Grow',
            content: '<p>Go live with confidence and start attracting the right customers immediately.</p>'
        }
    ]
    sections.push(planSection)

    // 5. Benefits (Icons)
    const benefitsSection = createDefaultSection('icons')
    benefitsSection.data.title = 'Everything you need to succeed'
    benefitsSection.data.items = [
        { iconKey: 'MessageSquare', label: 'Clear Messaging', description: 'Copy that sells' },
        { iconKey: 'Zap', label: 'Fast Loading', description: '90+ PageSpeed score' },
        { iconKey: 'Smartphone', label: 'Mobile Friendly', description: 'Looks great on phones' },
        { iconKey: 'Search', label: 'SEO Optimized', description: 'Built for Google' },
        { iconKey: 'Lock', label: 'Secure Hosting', description: 'SSL included' },
        { iconKey: 'Edit', label: 'Easy Updates', description: 'Edit text yourself' }
    ]
    benefitsSection.settings = { ...benefitsSection.settings, backgroundColor: 'alternate' }
    sections.push(benefitsSection)

    // 6. Social Proof (Testimonials)
    const testimonialSection = createDefaultSection('testimonials')
    testimonialSection.data.headline = 'Trusted by Business Owners'
    testimonialSection.data.items = [
        {
            quote: 'This platform changed my business completely. I finally have a site I\'m proud to show people.',
            author: 'Sarah Jenkins',
            role: 'Founder, Bloom & Co.'
        },
        {
            quote: 'The best investment we made this year. Our leads doubled in the first month.',
            author: 'Mike Ross',
            role: 'Director, Ross Realty'
        }
    ]
    sections.push(testimonialSection)

    // 7. Blog Preview (BlogList)
    const blogSection = createDefaultSection('blogList')
    blogSection.data.title = 'Ideas to help you grow'
    blogSection.data.limit = 3
    blogSection.data.showImage = true
    sections.push(blogSection)

    // 8. Final CTA (CallToAction)
    const ctaSection = createDefaultSection('callToAction')
    ctaSection.data.headline = 'Ready to stop losing leads?'
    ctaSection.data.subheadline = 'Schedule your free strategy call today.'
    ctaSection.data.ctaText = 'Schedule a Call'
    ctaSection.data.ctaLink = scheduleCallUrl
    ctaSection.data.ctaStyle = 'primary'
    ctaSection.settings = { ...ctaSection.settings, backgroundColor: 'primary' }
    sections.push(ctaSection)

    return {
        version: '2.0',
        layout: 'landing',
        sections,
        settings: {}
    }
}
