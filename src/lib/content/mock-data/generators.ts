/**
 * Mock data generator functions for content templates
 * Provides realistic, professional content for different business contexts
 */

import { ContentItem } from '../schema'
import { MockDataConfig, TestimonialItem, PricingTierItem, FeatureItem, TeamMemberItem, GalleryItem } from './types'

/**
 * Professional testimonial data pools
 */
const TESTIMONIAL_DATA = {
  names: [
    'Sarah Chen', 'Michael Rodriguez', 'Emily Johnson', 'David Kim', 'Rachel Martinez',
    'James Wilson', 'Lisa Thompson', 'Robert Lee', 'Amanda Davis', 'Christopher Brown',
    'Jennifer Garcia', 'Matthew Taylor', 'Jessica Anderson', 'Daniel Miller', 'Ashley White',
    'Ryan Jackson', 'Nicole Turner', 'Kevin Scott', 'Stephanie Clark', 'Brian Lewis'
  ],
  titles: [
    'CEO', 'CTO', 'VP of Marketing', 'Operations Director', 'Product Manager',
    'Senior Developer', 'Marketing Director', 'Head of Sales', 'Chief Innovation Officer', 'Technical Lead',
    'Project Manager', 'Business Analyst', 'UX Designer', 'Data Scientist', 'Customer Success Manager',
    'Growth Manager', 'Engineering Manager', 'Brand Manager', 'Strategy Consultant', 'Head of Operations'
  ],
  companies: [
    'TechFlow Solutions', 'InnovateCorp', 'DataStream Analytics', 'CloudFirst Technologies', 'NextGen Systems',
    'Precision Dynamics', 'Global Insights', 'Summit Strategies', 'Apex Innovations', 'Velocity Partners',
    'Catalyst Group', 'Pioneer Solutions', 'Quantum Analytics', 'Fusion Technologies', 'Impact Ventures',
    'Elevate Consulting', 'Momentum Labs', 'Nexus Corporation', 'Prism Analytics', 'Vector Solutions'
  ],
  testimonials: [
    'This solution transformed our workflow completely. We saw immediate improvements in efficiency and our team adoption rate was incredible.',
    'The level of support and attention to detail exceeded our expectations. Implementation was smooth and results were visible within weeks.',
    'Outstanding product that delivered exactly what was promised. The ROI was clear from day one and continues to grow.',
    'We\'ve tried many solutions in this space, but this one stands out for its intuitive design and powerful capabilities.',
    'The team\'s expertise and commitment to our success made all the difference. Highly recommend to any organization looking to scale.',
    'Game-changing technology that simplified our complex processes. Our productivity increased by 40% in the first quarter.',
    'Excellent customer service and a product that actually works as advertised. Rare combination in today\'s market.',
    'The integration capabilities saved us months of development time. Perfect fit for our existing tech stack.',
    'Professional, reliable, and innovative. This partnership has been instrumental in our company\'s growth.',
    'Impressed by the thoughtful approach to solving real business problems. The results speak for themselves.'
  ]
}

const PRICING_DATA = {
  tiers: [
    {
      name: 'Starter',
      prices: ['$29', '$39', '$49', '$59'],
      descriptions: [
        'Perfect for small teams getting started',
        'Ideal for individual professionals',
        'Great for startups and small businesses',
        'Essential features for growing teams'
      ],
      features: [
        ['Basic Dashboard', 'Email Support', 'Up to 5 Users', '10GB Storage', 'Mobile App'],
        ['Core Features', 'Standard Support', 'Up to 10 Users', '25GB Storage', 'API Access'],
        ['Essential Tools', 'Priority Email', 'Up to 15 Users', '50GB Storage', 'Basic Analytics'],
        ['Fundamental Features', 'Email & Chat Support', 'Up to 20 Users', '100GB Storage', 'Custom Branding']
      ]
    },
    {
      name: 'Professional',
      prices: ['$79', '$99', '$129', '$149'],
      descriptions: [
        'Advanced features for growing businesses',
        'Comprehensive solution for professionals',
        'Enhanced capabilities for scaling teams',
        'Complete toolkit for established companies'
      ],
      features: [
        ['Advanced Analytics', 'Priority Support', 'Up to 25 Users', '100GB Storage', 'Custom Integrations', 'Advanced Reporting'],
        ['Full Feature Set', 'Phone Support', 'Up to 50 Users', '250GB Storage', 'White Labeling', 'API Integration'],
        ['Premium Tools', '24/7 Support', 'Up to 100 Users', '500GB Storage', 'Advanced Security', 'Custom Workflows'],
        ['Professional Suite', 'Dedicated Support', 'Up to 150 Users', '1TB Storage', 'SSO Integration', 'Advanced Permissions']
      ]
    },
    {
      name: 'Enterprise',
      prices: ['$199', '$249', '$299', 'Custom'],
      descriptions: [
        'Comprehensive solution for large organizations',
        'Enterprise-grade features and security',
        'Scalable platform for complex requirements',
        'Custom solution tailored to your needs'
      ],
      features: [
        ['Unlimited Users', 'Dedicated Manager', 'Unlimited Storage', 'Enterprise Security', 'Custom Development', 'SLA Guarantee'],
        ['Full Platform Access', 'White Glove Support', 'Unlimited Everything', 'Advanced Compliance', 'Custom Features', '99.9% Uptime'],
        ['Complete Enterprise Suite', 'Premium Support', 'Unlimited Scale', 'Enterprise Integrations', 'Custom Training', 'Success Manager'],
        ['Fully Customized Solution', 'Dedicated Team', 'Unlimited Resources', 'Enterprise Security', 'Custom Development', 'Strategic Partnership']
      ]
    }
  ]
}

const FEATURE_DATA = {
  features: [
    {
      title: 'Intuitive Dashboard',
      content: 'Clean, user-friendly interface designed for efficiency and ease of use.',
      icon: 'BarChart3',
      category: 'user-experience',
      benefit: 'efficiency'
    },
    {
      title: 'Real-time Analytics',
      content: 'Comprehensive insights and reporting with live data visualization.',
      icon: 'TrendingUp',
      category: 'analytics',
      benefit: 'efficiency'
    },
    {
      title: 'Secure Platform',
      content: 'Enterprise-grade security with encryption and compliance standards.',
      icon: 'Shield',
      category: 'security',
      benefit: 'security'
    },
    {
      title: 'API Integration',
      content: 'Seamless connectivity with your existing tools and systems.',
      icon: 'Zap',
      category: 'integration',
      benefit: 'efficiency'
    },
    {
      title: '24/7 Support',
      content: 'Round-the-clock assistance from our expert technical team.',
      icon: 'Headphones',
      category: 'support',
      benefit: 'user-experience'
    },
    {
      title: 'Advanced Automation',
      content: 'Intelligent workflows that reduce manual tasks and improve productivity.',
      icon: 'Cpu',
      category: 'automation',
      benefit: 'efficiency'
    },
    {
      title: 'Cloud Infrastructure',
      content: 'Reliable, scalable cloud hosting with 99.9% uptime guarantee.',
      icon: 'Cloud',
      category: 'infrastructure',
      benefit: 'scalability'
    },
    {
      title: 'Mobile Optimized',
      content: 'Fully responsive design works perfectly on any device.',
      icon: 'Smartphone',
      category: 'mobile',
      benefit: 'user-experience'
    },
    {
      title: 'Custom Branding',
      content: 'White-label options to match your company\'s brand identity.',
      icon: 'Palette',
      category: 'customization',
      benefit: 'user-experience'
    },
    {
      title: 'Data Export',
      content: 'Easy data portability with multiple export formats supported.',
      icon: 'Download',
      category: 'data',
      benefit: 'efficiency'
    }
  ]
}

const TEAM_DATA = {
  members: [
    {
      name: 'Alex Thompson',
      title: 'Chief Executive Officer',
      bio: 'Visionary leader with over 15 years of experience in scaling technology companies.',
      department: 'Executive',
      experience: 15,
      specializations: ['Strategic Planning', 'Team Building', 'Market Expansion']
    },
    {
      name: 'Jordan Martinez',
      title: 'Chief Technology Officer',
      bio: 'Technical innovator focused on building scalable, cutting-edge solutions.',
      department: 'Engineering',
      experience: 12,
      specializations: ['System Architecture', 'Cloud Computing', 'AI/ML Implementation']
    },
    {
      name: 'Sam Chen',
      title: 'VP of Product',
      bio: 'Product strategist with a passion for creating user-centered solutions.',
      department: 'Product',
      experience: 10,
      specializations: ['Product Strategy', 'User Experience', 'Market Research']
    },
    {
      name: 'Taylor Johnson',
      title: 'Head of Marketing',
      bio: 'Growth-focused marketer with expertise in digital strategy and brand building.',
      department: 'Marketing',
      experience: 8,
      specializations: ['Digital Marketing', 'Brand Strategy', 'Growth Hacking']
    },
    {
      name: 'Casey Wilson',
      title: 'VP of Sales',
      bio: 'Results-driven sales leader with a track record of exceeding targets.',
      department: 'Sales',
      experience: 11,
      specializations: ['Enterprise Sales', 'Team Leadership', 'Customer Relations']
    },
    {
      name: 'Morgan Davis',
      title: 'Head of Design',
      bio: 'Creative designer focused on crafting beautiful, intuitive user experiences.',
      department: 'Design',
      experience: 9,
      specializations: ['UI/UX Design', 'Design Systems', 'User Research']
    }
  ]
}

const GALLERY_CATEGORIES = {
  product: [
    'Product showcase featuring clean design and premium materials',
    'Detailed view highlighting innovative features and functionality',
    'Product in use demonstrating practical applications',
    'Technical specifications and quality craftsmanship detail'
  ],
  portfolio: [
    'Award-winning project delivered for Fortune 500 client',
    'Innovative solution showcasing creative problem-solving',
    'Collaborative effort resulting in exceptional outcomes',
    'Strategic implementation driving measurable business results'
  ],
  office: [
    'Modern workspace designed for collaboration and innovation',
    'State-of-the-art facilities supporting team productivity',
    'Inspiring environment fostering creativity and growth',
    'Flexible spaces adapted for hybrid work culture'
  ],
  team: [
    'Team collaboration session driving strategic initiatives',
    'Professional development workshop enhancing skills',
    'Company milestone celebration recognizing achievements',
    'Cross-functional meeting aligning on key objectives'
  ]
}

/**
 * Generate a professional testimonial with realistic data
 */
export function generateTestimonial(index: number, config: MockDataConfig = {}): TestimonialItem {
  const nameIndex = index % TESTIMONIAL_DATA.names.length
  const titleIndex = index % TESTIMONIAL_DATA.titles.length
  const companyIndex = index % TESTIMONIAL_DATA.companies.length
  const testimonialIndex = index % TESTIMONIAL_DATA.testimonials.length
  
  return {
    id: `testimonial-${Date.now()}-${index}`,
    title: TESTIMONIAL_DATA.names[nameIndex],
    subtitle: TESTIMONIAL_DATA.titles[titleIndex],
    content: TESTIMONIAL_DATA.testimonials[testimonialIndex],
    image: `/api/placeholder/150/150/person/professional-${(index % 20) + 1}`,
    order: index,
    metadata: {
      company: TESTIMONIAL_DATA.companies[companyIndex],
      industry: config.businessType || 'technology',
      rating: 5,
      date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      location: ['New York, NY', 'San Francisco, CA', 'Austin, TX', 'Seattle, WA', 'Boston, MA'][index % 5],
      verified: true
    }
  }
}

/**
 * Generate pricing tier information
 */
export function generatePricingTier(tier: 'starter' | 'professional' | 'enterprise'): PricingTierItem {
  const tierIndex = tier === 'starter' ? 0 : tier === 'professional' ? 1 : 2
  const tierData = PRICING_DATA.tiers[tierIndex]
  const variantIndex = Math.floor(Math.random() * tierData.prices.length)
  
  return {
    id: `pricing-${tier}-${Date.now()}`,
    title: tierData.name,
    subtitle: tierData.prices[variantIndex],
    content: tierData.descriptions[variantIndex],
    order: tierIndex,
    metadata: {
      price: tier === 'starter' ? 49 : tier === 'professional' ? 99 : 199,
      period: 'monthly',
      features: tierData.features[variantIndex],
      highlighted: tier === 'professional',
      cta: tier === 'enterprise' ? 'Contact Sales' : 'Start Free Trial',
      badge: tier === 'professional' ? 'Most Popular' : undefined
    }
  }
}

/**
 * Generate feature card content
 */
export function generateFeature(index: number, config: MockDataConfig = {}): FeatureItem {
  const featureIndex = index % FEATURE_DATA.features.length
  const feature = FEATURE_DATA.features[featureIndex]
  
  return {
    id: `feature-${Date.now()}-${index}`,
    title: feature.title,
    content: feature.content,
    icon: feature.icon,
    order: index,
    metadata: {
      category: feature.category,
      benefit: feature.benefit as any,
      complexity: config.companySize === 'enterprise' ? 'enterprise' : 'basic',
      metrics: {
        improvement: ['30% faster', '50% reduction', '2x increase', '40% savings'][index % 4],
        usage: ['95% adoption', '98% uptime', '24/7 availability', 'Real-time updates'][index % 4]
      }
    }
  }
}

/**
 * Generate team member profile
 */
export function generateTeamMember(index: number, config: MockDataConfig = {}): TeamMemberItem {
  const memberIndex = index % TEAM_DATA.members.length
  const member = TEAM_DATA.members[memberIndex]
  
  return {
    id: `team-${Date.now()}-${index}`,
    title: member.name,
    subtitle: member.title,
    content: member.bio,
    image: `/api/placeholder/300/300/person/professional-${(index % 20) + 1}`,
    order: index,
    metadata: {
      department: member.department,
      experience: member.experience,
      specializations: member.specializations,
      contact: {
        linkedin: `https://linkedin.com/in/${member.name.toLowerCase().replace(' ', '-')}`
      },
      funFact: [
        'Avid coffee enthusiast and roasting hobbyist',
        'Marathon runner and fitness enthusiast',
        'Tech blogger with 50K+ followers',
        'Volunteer coding instructor on weekends',
        'Photography enthusiast and world traveler'
      ][index % 5]
    }
  }
}

/**
 * Generate gallery image content
 */
export function generateGalleryImage(
  index: number, 
  category: 'product' | 'portfolio' | 'office' | 'team' = 'portfolio'
): GalleryItem {
  const descriptions = GALLERY_CATEGORIES[category]
  const descriptionIndex = index % descriptions.length
  
  const dimensions = category === 'product' ? '500/400' : category === 'office' ? '600/400' : '800/600'
  
  return {
    id: `gallery-${category}-${Date.now()}-${index}`,
    title: `${category.charAt(0).toUpperCase() + category.slice(1)} ${index + 1}`,
    content: descriptions[descriptionIndex],
    image: `/api/placeholder/${dimensions}/${category}/item-${(index % 10) + 1}`,
    order: index,
    metadata: {
      category,
      project: category === 'portfolio' ? {
        client: ['Fortune 500 Tech Company', 'Leading Healthcare Provider', 'Global Financial Services', 'Major Retail Chain'][index % 4],
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: ['3 months', '6 months', '9 months', '12 months'][index % 4],
        technologies: [
          ['React', 'TypeScript', 'AWS'],
          ['Node.js', 'PostgreSQL', 'Docker'],
          ['Python', 'TensorFlow', 'GCP'],
          ['Vue.js', 'MongoDB', 'Azure']
        ][index % 4]
      } : undefined,
      imageDetails: {
        alt: `${category} image ${index + 1}`,
        caption: descriptions[descriptionIndex],
        photographer: 'Professional Photography Team'
      }
    }
  }
}

/**
 * Generate a complete set of testimonials
 */
export function generateTestimonials(count: number = 6, config: MockDataConfig = {}): TestimonialItem[] {
  return Array.from({ length: count }, (_, index) => generateTestimonial(index, config))
}

/**
 * Generate all pricing tiers
 */
export function generatePricingTiers(): PricingTierItem[] {
  return [
    generatePricingTier('starter'),
    generatePricingTier('professional'),
    generatePricingTier('enterprise')
  ]
}

/**
 * Generate a complete feature set
 */
export function generateFeatures(count: number = 6, config: MockDataConfig = {}): FeatureItem[] {
  return Array.from({ length: count }, (_, index) => generateFeature(index, config))
}

/**
 * Generate team member profiles
 */
export function generateTeamMembers(count: number = 6, config: MockDataConfig = {}): TeamMemberItem[] {
  return Array.from({ length: count }, (_, index) => generateTeamMember(index, config))
}

/**
 * Generate gallery items
 */
export function generateGalleryItems(
  count: number = 8, 
  category: 'product' | 'portfolio' | 'office' | 'team' = 'portfolio'
): GalleryItem[] {
  return Array.from({ length: count }, (_, index) => generateGalleryImage(index, category))
}

/**
 * Generate mixed content items based on type
 */
export function generateContentItems(
  type: 'testimonials' | 'features' | 'team' | 'gallery' | 'pricing',
  count: number = 6,
  config: MockDataConfig = {}
): ContentItem[] {
  switch (type) {
    case 'testimonials':
      return generateTestimonials(count, config)
    case 'features':
      return generateFeatures(count, config)
    case 'team':
      return generateTeamMembers(count, config)
    case 'gallery':
      return generateGalleryItems(count)
    case 'pricing':
      return generatePricingTiers()
    default:
      return []
  }
}