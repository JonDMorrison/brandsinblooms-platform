import { Json } from '@/src/lib/database/types'
import {
    LayoutTemplate,
    Type,
    Image,
    Grid,
    MessageSquareQuote,
    HelpCircle,
    MousePointerClick,
    Columns,
    Images,
    Video,
    Newspaper,
    Star,
    LayoutGrid,
    DollarSign,
    FormInput,
    Building,
    LayoutTop,
    LayoutBottom,
    Flower,
    Sprout,
    Sun,
    CloudRain,
    Calendar,
    MapPin,
    CalendarDays,
    Mic,
    Users,
    Mail,
    Code,
    Link
} from 'lucide-react'

/**
 * Core section types available for all sites
 */
export type CoreSectionType =
    | 'hero'
    | 'text'
    | 'textMedia'
    | 'textWithImage'
    | 'featuresGrid'
    | 'testimonials'
    | 'faq'
    | 'callToAction'
    | 'contentColumns'
    | 'gallery'
    | 'videoEmbed'
    | 'blogList'
    | 'featured'
    | 'categories'
    | 'pricing'
    | 'form'
    | 'contactForm'
    | 'map'
    | 'events'
    | 'news'
    | 'blogs'
    | 'imageLinks'
    | 'podcasts'
    | 'video'
    | 'users'
    | 'newsletter'
    | 'icons'
    | 'customCode'
    | 'blogHeader'
    | 'businessInfo'
    | 'header' // Legacy/Specific
    | 'footer' // Legacy/Specific
    | 'eventsList'

/**
 * Plant-specific section types (kept for backward compatibility/vertical specifics)
 */
export type PlantSectionType =
    | 'plant_showcase'
    | 'plant_grid'
    | 'plant_care_guide'
    | 'seasonal_tips'
    | 'growing_conditions'
    | 'care_calendar'

export type SectionType = CoreSectionType | PlantSectionType

/**
 * Button style variants for CTA buttons
 */
export type ButtonStyleVariant = 'primary' | 'secondary' | 'accent'

/**
 * Base interface for all content sections
 */
export interface ContentSection {
    id: string
    type: SectionType
    visible: boolean
    settings?: {
        backgroundColor?: 'default' | 'alternate' | 'primary' | 'dark' | 'gradient'
        padding?: 'none' | 'small' | 'medium' | 'large'
        containerWidth?: 'narrow' | 'default' | 'wide' | 'full'
        [key: string]: Json | undefined
    }
    data: Record<string, any>
}

/**
 * Registry metadata for sections (labels, icons, default data)
 */
export interface SectionMetadata {
    label: string
    description: string
    icon: any // Lucide icon component
    category: 'content' | 'media' | 'advanced' | 'marketing'
    defaultData: Record<string, any>
}

export interface TextMediaData {
    title: string
    subtitle?: string
    body: string
    image?: {
        url: string
        alt?: string
    }
    layout: 'imageLeft' | 'imageRight' | 'stacked'
    align?: 'start' | 'center' | 'end'
    button?: {
        label: string
        url: string
        style?: 'primary' | 'secondary' | 'link'
    }
    background?: 'default' | 'muted' | 'highlight'
}

export const SECTION_REGISTRY: Record<SectionType, SectionMetadata> = {
    hero: {
        label: 'Hero',
        description: 'Large introductory section with headline and CTA',
        icon: LayoutTemplate,
        category: 'marketing',
        defaultData: {
            headline: 'Welcome to Our Site',
            subheadline: 'We help you grow your business',
            alignment: 'center',
            ctaText: 'Get Started',
            ctaLink: '#',
            ctaStyle: 'primary'
        }
    },
    text: {
        label: 'Text Block',
        description: 'Simple text content',
        icon: Type,
        category: 'content',
        defaultData: {
            content: '<p>Write your content here...</p>'
        }
    },
    textMedia: {
        label: 'Text Media',
        description: 'Image and text side by side',
        icon: Image,
        category: 'content',
        defaultData: {
            title: 'Heading goes here',
            subtitle: '',
            body: '<p>Replace this text with your content.</p>',
            image: undefined,
            layout: 'imageRight',
            align: 'start',
            button: {
                label: '',
                url: '',
                style: 'primary'
            },
            background: 'default'
        } as TextMediaData
    },
    textWithImage: {
        label: 'Text with Image',
        description: 'Text alongside an image',
        icon: Image,
        category: 'content',
        defaultData: {
            headline: 'About Us',
            content: '<p>Tell your story here...</p>',
            image: '/images/placeholder.jpg',
            imagePosition: 'right'
        }
    },
    map: {
        label: 'Map',
        description: 'Show your location',
        icon: MapPin,
        category: 'content',
        defaultData: {
            title: 'Our Location',
            address: '123 Main St, City, Country',
            embedUrl: ''
        }
    },
    contactForm: {
        label: 'Contact Form',
        description: 'Capture inquiries from visitors',
        icon: FormInput,
        category: 'marketing',
        defaultData: {
            title: 'Contact Us',
            description: 'Send us a message',
            formVariant: 'default'
        }
    },
    events: {
        label: 'Events',
        description: 'List upcoming events',
        icon: CalendarDays,
        category: 'content',
        defaultData: {
            title: 'Upcoming Events',
            showExcerpt: true,
            maxItems: 3
        }
    },
    eventsList: {
        label: 'Events List',
        description: 'Display upcoming events in a list or grid',
        icon: CalendarDays,
        category: 'content',
        defaultData: {
            title: 'Upcoming Events',
            subtitle: 'Join us for these upcoming events.',
            limit: 3,
            layout: 'list',
            programId: null
        }
    },
    news: {
        label: 'News',
        description: 'Show latest announcements',
        icon: Newspaper,
        category: 'content',
        defaultData: {
            title: 'Latest News',
            showExcerpt: true,
            maxItems: 3
        }
    },
    blogs: {
        label: 'Blogs',
        description: 'Highlight blog posts',
        icon: Newspaper,
        category: 'content',
        defaultData: {
            title: 'From the Blog',
            showExcerpt: true,
            maxItems: 3
        }
    },
    imageLinks: {
        label: 'Image Links',
        description: 'Clickable image cards',
        icon: Link,
        category: 'content',
        defaultData: {
            title: 'Quick Links',
            items: [
                { label: 'Link 1', url: '#', image: '/images/placeholder.jpg' },
                { label: 'Link 2', url: '#', image: '/images/placeholder.jpg' },
                { label: 'Link 3', url: '#', image: '/images/placeholder.jpg' }
            ]
        }
    },
    podcasts: {
        label: 'Podcasts',
        description: 'Embed podcast episodes',
        icon: Mic,
        category: 'media',
        defaultData: {
            title: 'Latest Episodes',
            description: 'Listen to our podcast',
            items: []
        }
    },
    video: {
        label: 'Video',
        description: 'Feature a video player',
        icon: Video,
        category: 'media',
        defaultData: {
            title: 'Featured Video',
            description: '',
            embedUrl: ''
        }
    },
    users: {
        label: 'Users',
        description: 'Show team or staff',
        icon: Users,
        category: 'content',
        defaultData: {
            title: 'Our Team',
            subtitle: 'Meet the people behind the magic',
            maxItems: 4
        }
    },
    newsletter: {
        label: 'Newsletter',
        description: 'Email capture section',
        icon: Mail,
        category: 'marketing',
        defaultData: {
            title: 'Subscribe',
            description: 'Get the latest updates',
            ctaLabel: 'Subscribe',
            embedFormId: ''
        }
    },
    icons: {
        label: 'Icons',
        description: 'Icon + text highlights',
        icon: Star,
        category: 'content',
        defaultData: {
            title: 'Highlights',
            items: [
                { iconKey: 'Star', label: 'Feature 1', description: 'Description' },
                { iconKey: 'Zap', label: 'Feature 2', description: 'Description' },
                { iconKey: 'Shield', label: 'Feature 3', description: 'Description' }
            ]
        }
    },
    customCode: {
        label: 'Custom Code',
        description: 'Advanced HTML/CSS/JS',
        icon: Code,
        category: 'advanced',
        defaultData: {
            html: '<!-- Custom HTML -->',
            css: '',
            js: ''
        }
    },
    featuresGrid: {
        label: 'Features Grid',
        description: 'Grid of features or services',
        icon: Grid,
        category: 'content',
        defaultData: {
            headline: 'Our Features',
            columns: 3,
            items: [
                { title: 'Feature 1', description: 'Description 1', icon: 'Star' },
                { title: 'Feature 2', description: 'Description 2', icon: 'Zap' },
                { title: 'Feature 3', description: 'Description 3', icon: 'Shield' }
            ]
        }
    },
    testimonials: {
        label: 'Testimonials',
        description: 'Customer reviews and feedback',
        icon: MessageSquareQuote,
        category: 'marketing',
        defaultData: {
            headline: 'What Our Clients Say',
            items: [
                { quote: 'Amazing service!', author: 'Jane Doe', role: 'CEO' }
            ]
        }
    },
    faq: {
        label: 'FAQ',
        description: 'Frequently asked questions',
        icon: HelpCircle,
        category: 'content',
        defaultData: {
            headline: 'Frequently Asked Questions',
            items: [
                { question: 'Question 1?', answer: 'Answer 1' }
            ]
        }
    },
    callToAction: {
        label: 'Call to Action',
        description: 'Prominent button to drive action',
        icon: MousePointerClick,
        category: 'marketing',
        defaultData: {
            headline: 'Ready to start?',
            subheadline: 'Join us today',
            ctaText: 'Sign Up Now',
            ctaLink: '/signup',
            ctaStyle: 'primary'
        }
    },
    contentColumns: {
        label: 'Content Columns',
        description: 'Multi-column text content',
        icon: Columns,
        category: 'content',
        defaultData: {
            columns: 2,
            items: [
                { headline: 'Column 1', content: 'Content...' },
                { headline: 'Column 2', content: 'Content...' }
            ]
        }
    },
    gallery: {
        label: 'Image Gallery',
        description: 'Grid of images',
        icon: Images,
        category: 'media',
        defaultData: {
            columns: 3,
            images: []
        }
    },
    videoEmbed: {
        label: 'Video Embed',
        description: 'Embed a video from YouTube or Vimeo',
        icon: Video,
        category: 'media',
        defaultData: {
            url: '',
            caption: ''
        }
    },
    blogList: {
        label: 'Latest Posts',
        description: 'List of recent blog posts',
        icon: Newspaper,
        category: 'content',
        defaultData: {
            limit: 3,
            showImage: true
        }
    },
    featured: {
        label: 'Featured Items',
        description: 'Highlight specific items or products',
        icon: Star,
        category: 'marketing',
        defaultData: {
            headline: 'Featured',
            items: []
        }
    },
    categories: {
        label: 'Categories',
        description: 'Grid of categories',
        icon: LayoutGrid,
        category: 'content',
        defaultData: {
            headline: 'Categories',
            items: []
        }
    },
    pricing: {
        label: 'Pricing',
        description: 'Pricing tables',
        icon: DollarSign,
        category: 'marketing',
        defaultData: {
            headline: 'Pricing',
            items: []
        }
    },
    form: {
        label: 'Form',
        description: 'Contact or lead capture form',
        icon: FormInput,
        category: 'marketing',
        defaultData: {
            headline: 'Contact Us',
            fields: []
        }
    },
    blogHeader: {
        label: 'Blog Header',
        description: 'Header for blog posts',
        icon: Type,
        category: 'content',
        defaultData: {
            title: 'Blog Post Title',
            subtitle: 'Subtitle',
            author: 'Author Name',
            publishedDate: new Date().toISOString().split('T')[0]
        }
    },
    businessInfo: {
        label: 'Business Info',
        description: 'Contact details and hours',
        icon: Building,
        category: 'content',
        defaultData: {
            headline: 'Contact Info',
            address: '',
            phone: '',
            email: ''
        }
    },
    // Legacy/Specific mappings
    header: {
        label: 'Header',
        description: 'Site header',
        icon: LayoutTop,
        category: 'content',
        defaultData: {}
    },
    footer: {
        label: 'Footer',
        description: 'Site footer',
        icon: LayoutBottom,
        category: 'content',
        defaultData: {}
    },
    // Plant specific
    plant_showcase: {
        label: 'Plant Showcase',
        description: 'Highlight specific plants',
        icon: Flower,
        category: 'content',
        defaultData: {}
    },
    plant_grid: {
        label: 'Plant Grid',
        description: 'Grid of plants',
        icon: LayoutGrid,
        category: 'content',
        defaultData: {}
    },
    plant_care_guide: {
        label: 'Care Guide',
        description: 'Plant care instructions',
        icon: Sprout,
        category: 'content',
        defaultData: {}
    },
    seasonal_tips: {
        label: 'Seasonal Tips',
        description: 'Tips for the current season',
        icon: Sun,
        category: 'content',
        defaultData: {}
    },
    growing_conditions: {
        label: 'Growing Conditions',
        description: 'Light, water, and soil requirements',
        icon: CloudRain,
        category: 'content',
        defaultData: {}
    },
    care_calendar: {
        label: 'Care Calendar',
        description: 'Monthly care schedule',
        icon: Calendar,
        category: 'content',
        defaultData: {}
    }
}

export const SECTION_CATALOG = Object.entries(SECTION_REGISTRY).map(([type, meta]) => ({
    type: type as SectionType,
    ...meta
}))

export function createDefaultSection(type: SectionType): ContentSection {
    const metadata = SECTION_REGISTRY[type]
    return {
        id: crypto.randomUUID(),
        type,
        visible: true,
        settings: {
            backgroundColor: 'default',
            padding: 'medium',
            containerWidth: 'default'
        },
        data: JSON.parse(JSON.stringify(metadata.defaultData)) // Deep copy
    }
}
