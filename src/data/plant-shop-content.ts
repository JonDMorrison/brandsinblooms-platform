/**
 * Plant Shop Content Data Structure
 * Comprehensive JSON data for a professional plant shop website
 * Designed for block-based CMS integration with authentic plant details
 */

// TypeScript Interfaces

export interface PlantCareRequirements {
  light: 'full sun' | 'partial sun' | 'partial shade' | 'full shade';
  water: 'low' | 'moderate' | 'high';
  humidity: 'low' | 'moderate' | 'high';
  temperature: {
    min: number; // Celsius
    max: number; // Celsius
  };
  soil: string;
  fertilizer: string;
  hardinessZones: string[];
}

export interface PlantData {
  id: string;
  name: string;
  scientificName: string;
  category: 'houseplants' | 'outdoor' | 'succulents' | 'herbs' | 'flowering';
  careLevel: 'beginner' | 'intermediate' | 'expert';
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  careRequirements: PlantCareRequirements;
  features: string[];
  seasonalNotes?: string;
  inStock: boolean;
  featured: boolean;
}

export interface CareGuide {
  id: string;
  title: string;
  description: string;
  downloadUrl: string;
  category: 'general' | 'seasonal' | 'troubleshooting' | 'propagation';
  plantTypes: string[];
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
  expertise: string[];
  credentials?: string;
}

export interface ContentBlock {
  type: 'hero' | 'featured_plants' | 'categories' | 'mission' | 'team' | 'contact' | 'care_guides' | 'testimonials' | 'seasonal' | 'legal';
  id: string;
  title?: string;
  content: unknown;
  isVisible: boolean;
  order: number;
}

export interface PageData {
  id: string;
  title: string;
  description: string;
  blocks: ContentBlock[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

// Plant Data
export const plantsData: PlantData[] = [
  // Beginner Plants
  {
    id: 'pothos-golden',
    name: 'Golden Pothos',
    scientificName: 'Epipremnum aureum',
    category: 'houseplants',
    careLevel: 'beginner',
    price: 24.99,
    image: '/images/golden-pothos.jpg',
    description: 'A classic trailing houseplant perfect for beginners. Known for its heart-shaped leaves with golden variegation and exceptional tolerance to various light conditions.',
    careRequirements: {
      light: 'partial shade',
      water: 'moderate',
      humidity: 'moderate',
      temperature: { min: 18, max: 29 },
      soil: 'Well-draining potting mix with perlite',
      fertilizer: 'Balanced liquid fertilizer monthly during growing season',
      hardinessZones: ['10a', '10b', '11a', '11b']
    },
    features: ['Air purifying', 'Fast growing', 'Easy propagation', 'Low maintenance'],
    inStock: true,
    featured: true
  },
  {
    id: 'snake-plant',
    name: 'Snake Plant',
    scientificName: 'Sansevieria trifasciata',
    category: 'houseplants',
    careLevel: 'beginner',
    price: 32.99,
    image: '/images/snake-plant.jpg',
    description: 'Architectural upright plant with striking sword-like leaves. Extremely drought tolerant and perfect for low-light conditions.',
    careRequirements: {
      light: 'partial shade',
      water: 'low',
      humidity: 'low',
      temperature: { min: 15, max: 32 },
      soil: 'Well-draining cactus or succulent mix',
      fertilizer: 'Diluted liquid fertilizer every 2-3 months',
      hardinessZones: ['9b', '10a', '10b', '11a', '11b']
    },
    features: ['Extremely drought tolerant', 'Low light tolerant', 'Air purifying', 'Architectural form'],
    inStock: true,
    featured: true
  },
  {
    id: 'zz-plant',
    name: 'ZZ Plant',
    scientificName: 'Zamioculcas zamiifolia',
    category: 'houseplants',
    careLevel: 'beginner',
    price: 28.99,
    image: '/images/zz-plant.jpg',
    description: 'Modern houseplant with glossy, dark green leaves. Thrives on neglect and tolerates low light conditions exceptionally well.',
    careRequirements: {
      light: 'partial shade',
      water: 'low',
      humidity: 'low',
      temperature: { min: 18, max: 26 },
      soil: 'Well-draining potting mix with added perlite',
      fertilizer: 'Balanced fertilizer every 2-3 months during growing season',
      hardinessZones: ['9b', '10a', '10b', '11a', '11b']
    },
    features: ['Extremely low maintenance', 'Drought tolerant', 'Low light tolerant', 'Glossy foliage'],
    inStock: true,
    featured: false
  },

  // Intermediate Plants
  {
    id: 'fiddle-leaf-fig',
    name: 'Fiddle Leaf Fig',
    scientificName: 'Ficus lyrata',
    category: 'houseplants',
    careLevel: 'intermediate',
    price: 89.99,
    originalPrice: 109.99,
    image: '/images/fiddle-leaf-fig.jpg',
    description: 'Statement plant with large, violin-shaped leaves. Requires consistent care and bright, indirect light to maintain its dramatic appearance.',
    careRequirements: {
      light: 'partial sun',
      water: 'moderate',
      humidity: 'moderate',
      temperature: { min: 18, max: 24 },
      soil: 'Well-draining potting mix with good aeration',
      fertilizer: 'Balanced liquid fertilizer bi-weekly during growing season',
      hardinessZones: ['10a', '10b', '11a', '11b']
    },
    features: ['Large dramatic leaves', 'Statement plant', 'Air purifying', 'Fast growing when happy'],
    seasonalNotes: 'Reduce watering frequency during winter months and avoid cold drafts',
    inStock: true,
    featured: true
  },
  {
    id: 'monstera-deliciosa',
    name: 'Monstera Deliciosa',
    scientificName: 'Monstera deliciosa',
    category: 'houseplants',
    careLevel: 'intermediate',
    price: 45.99,
    image: '/images/monstera-deliciosa.jpg',
    description: 'Tropical climbing plant famous for its fenestrated leaves. Develops characteristic splits and holes as it matures with proper support.',
    careRequirements: {
      light: 'partial sun',
      water: 'moderate',
      humidity: 'high',
      temperature: { min: 18, max: 27 },
      soil: 'Rich, well-draining potting mix with peat and perlite',
      fertilizer: 'Balanced liquid fertilizer monthly during growing season',
      hardinessZones: ['10b', '11a', '11b']
    },
    features: ['Fenestrated leaves', 'Climbing habit', 'Large mature size', 'Tropical appearance'],
    seasonalNotes: 'Provide moss pole or trellis for climbing support',
    inStock: true,
    featured: true
  },

  // Expert Plants
  {
    id: 'calathea-orbifolia',
    name: 'Calathea Orbifolia',
    scientificName: 'Calathea orbifolia',
    category: 'houseplants',
    careLevel: 'expert',
    price: 67.99,
    image: '/images/calathea-orbifolia.jpg',
    description: 'Prayer plant with stunning large, round leaves featuring silver-green stripes. Requires high humidity and consistent moisture.',
    careRequirements: {
      light: 'partial shade',
      water: 'high',
      humidity: 'high',
      temperature: { min: 20, max: 26 },
      soil: 'Peat-based mix with excellent drainage and moisture retention',
      fertilizer: 'Diluted liquid fertilizer every 2 weeks during growing season',
      hardinessZones: ['11a', '11b']
    },
    features: ['Prayer plant movement', 'Striking leaf patterns', 'Air purifying', 'Non-toxic to pets'],
    seasonalNotes: 'Requires humidifier during winter months and filtered or distilled water',
    inStock: false,
    featured: false
  },

  // Outdoor Plants
  {
    id: 'japanese-maple',
    name: 'Japanese Maple',
    scientificName: 'Acer palmatum',
    category: 'outdoor',
    careLevel: 'intermediate',
    price: 124.99,
    image: '/images/japanese-maple.jpg',
    description: 'Elegant deciduous tree with delicate, palmate leaves that provide stunning fall color. Perfect specimen plant for gardens.',
    careRequirements: {
      light: 'partial sun',
      water: 'moderate',
      humidity: 'moderate',
      temperature: { min: -20, max: 30 },
      soil: 'Rich, well-draining acidic soil with organic matter',
      fertilizer: 'Slow-release granular fertilizer in spring',
      hardinessZones: ['5a', '5b', '6a', '6b', '7a', '7b', '8a', '8b', '9a']
    },
    features: ['Spectacular fall color', 'Elegant form', 'Four-season interest', 'Deciduous'],
    seasonalNotes: 'Protect from harsh winter winds and provide winter protection in zones 5-6',
    inStock: true,
    featured: true
  },

  // Succulents
  {
    id: 'echeveria-elegans',
    name: 'Mexican Snowball',
    scientificName: 'Echeveria elegans',
    category: 'succulents',
    careLevel: 'beginner',
    price: 16.99,
    image: '/images/echeveria-elegans.jpg',
    description: 'Compact rosette succulent with blue-green leaves and pink flower spikes. Perfect for containers and rock gardens.',
    careRequirements: {
      light: 'full sun',
      water: 'low',
      humidity: 'low',
      temperature: { min: 7, max: 32 },
      soil: 'Fast-draining cactus and succulent mix',
      fertilizer: 'Diluted cactus fertilizer monthly during growing season',
      hardinessZones: ['9a', '9b', '10a', '10b', '11a', '11b']
    },
    features: ['Compact rosette form', 'Pink flower spikes', 'Drought tolerant', 'Easy propagation'],
    seasonalNotes: 'Reduce watering significantly in winter and protect from frost',
    inStock: true,
    featured: false
  }
];

// Care Guides Data
export const careGuidesData: CareGuide[] = [
  {
    id: 'houseplant-basics',
    title: 'Complete Houseplant Care Guide',
    description: 'Essential care instructions for thriving indoor plants, covering watering, lighting, and common troubleshooting.',
    downloadUrl: '/downloads/houseplant-basics-guide.pdf',
    category: 'general',
    plantTypes: ['houseplants']
  },
  {
    id: 'seasonal-plant-care',
    title: 'Seasonal Plant Care Calendar',
    description: 'Month-by-month care schedule for indoor and outdoor plants throughout the growing season.',
    downloadUrl: '/downloads/seasonal-care-calendar.pdf',
    category: 'seasonal',
    plantTypes: ['houseplants', 'outdoor']
  },
  {
    id: 'propagation-techniques',
    title: 'Plant Propagation Mastery',
    description: 'Step-by-step techniques for propagating your favorite plants through cuttings, division, and layering.',
    downloadUrl: '/downloads/propagation-guide.pdf',
    category: 'propagation',
    plantTypes: ['houseplants', 'succulents']
  },
  {
    id: 'succulent-care',
    title: 'Succulent & Cactus Care Guide',
    description: 'Specialized care instructions for drought-tolerant plants, including watering schedules and light requirements.',
    downloadUrl: '/downloads/succulent-care-guide.pdf',
    category: 'general',
    plantTypes: ['succulents']
  },
  {
    id: 'pest-problem-solving',
    title: 'Plant Pest & Problem Diagnostic Guide',
    description: 'Identify and treat common plant pests, diseases, and environmental issues with natural solutions.',
    downloadUrl: '/downloads/pest-problem-guide.pdf',
    category: 'troubleshooting',
    plantTypes: ['houseplants', 'outdoor', 'succulents']
  }
];

// Team Data
export const teamData: TeamMember[] = [
  {
    name: 'Sarah Chen',
    role: 'Master Horticulturist & Owner',
    bio: 'With over 15 years of experience in botanical gardens and plant breeding, Sarah brings expert knowledge of plant cultivation and care.',
    image: '/images/team/sarah-chen.jpg',
    expertise: ['Plant breeding', 'Tropical plants', 'Disease diagnosis', 'Propagation techniques'],
    credentials: 'M.S. Horticulture, Certified Master Gardener'
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Landscape Design Specialist',
    bio: 'Marcus specializes in creating stunning outdoor spaces that thrive in local climate conditions with sustainable gardening practices.',
    image: '/images/team/marcus-rodriguez.jpg',
    expertise: ['Landscape design', 'Native plants', 'Xeriscaping', 'Permaculture'],
    credentials: 'B.S. Landscape Architecture, Certified Permaculture Designer'
  },
  {
    name: 'Emma Thompson',
    role: 'Houseplant Care Expert',
    bio: 'Emma\'s passion for indoor gardening has made her our go-to expert for houseplant selection and troubleshooting care issues.',
    image: '/images/team/emma-thompson.jpg',
    expertise: ['Houseplant care', 'Air purifying plants', 'Low-light gardening', 'Plant styling'],
    credentials: 'Certified Indoor Plant Specialist'
  }
];

// Page Content Data
export const plantShopContent: Record<string, PageData> = {
  home: {
    id: 'home',
    title: 'Premium Plants & Expert Care',
    description: 'Transform your space with carefully curated plants and professional horticultural expertise.',
    seo: {
      title: 'Blooms & Botanicals - Premium Plants & Expert Care | Houseplants, Outdoor Plants & Succulents',
      description: 'Discover premium houseplants, outdoor specimens, and succulents with expert care guidance. Professional horticulturists, care guides, and plant expertise since 2018.',
      keywords: ['houseplants', 'outdoor plants', 'succulents', 'plant care', 'horticulture', 'gardening', 'plant nursery', 'plant experts']
    },
    blocks: [
      {
        type: 'hero',
        id: 'hero-section',
        title: 'Transform Your Space with Living Beauty',
        content: {
          headline: 'Transform Your Space with Living Beauty',
          subheadline: 'Discover premium plants and expert horticultural guidance for thriving indoor and outdoor gardens',
          ctaText: 'Shop Plants',
          ctaLink: '/plants',
          secondaryCtaText: 'Care Guides',
          secondaryCtaLink: '/care-guides',
          backgroundImage: '/images/hero-greenhouse.jpg',
          features: [
            'Expert horticultural guidance',
            'Premium plant selection',
            'Comprehensive care resources',
            'Local hardiness zone expertise'
          ]
        },
        isVisible: true,
        order: 1
      },
      {
        type: 'featured_plants',
        id: 'featured-plants',
        title: 'Featured Plants',
        content: {
          headline: 'Featured Plants This Season',
          description: 'Handpicked selections from our master horticulturists, perfect for current growing conditions',
          plants: plantsData.filter(plant => plant.featured),
          viewAllLink: '/plants'
        },
        isVisible: true,
        order: 2
      },
      {
        type: 'categories',
        id: 'plant-categories',
        title: 'Shop by Category',
        content: {
          headline: 'Find Your Perfect Plant Match',
          description: 'Browse our expertly curated collections organized by care complexity and plant type',
          categories: [
            {
              name: 'Beginner-Friendly',
              description: 'Perfect for new plant parents - low maintenance, forgiving varieties',
              image: '/images/categories/beginner-plants.jpg',
              link: '/plants?care-level=beginner',
              plantCount: plantsData.filter(p => p.careLevel === 'beginner').length
            },
            {
              name: 'Houseplants',
              description: 'Transform indoor spaces with air-purifying and decorative plants',
              image: '/images/categories/houseplants.jpg',
              link: '/plants?category=houseplants',
              plantCount: plantsData.filter(p => p.category === 'houseplants').length
            },
            {
              name: 'Outdoor Specimens',
              description: 'Hardy outdoor plants for landscaping and garden design',
              image: '/images/categories/outdoor-plants.jpg',
              link: '/plants?category=outdoor',
              plantCount: plantsData.filter(p => p.category === 'outdoor').length
            },
            {
              name: 'Succulents & Cacti',
              description: 'Drought-tolerant beauties perfect for sunny spots and xeriscaping',
              image: '/images/categories/succulents.jpg',
              link: '/plants?category=succulents',
              plantCount: plantsData.filter(p => p.category === 'succulents').length
            }
          ]
        },
        isVisible: true,
        order: 3
      },
      {
        type: 'seasonal',
        id: 'seasonal-guidance',
        title: 'Seasonal Plant Care',
        content: {
          headline: 'Fall Plant Care Essentials',
          description: 'Prepare your plants for the changing season with expert guidance',
          currentSeason: 'fall',
          tips: [
            'Reduce watering frequency as growth slows',
            'Move tender plants indoors before first frost',
            'Apply winter protection to marginally hardy plants',
            'Clean up fallen leaves to prevent fungal issues',
            'Adjust fertilizer schedules for dormant season'
          ],
          featuredGuide: careGuidesData.find(guide => guide.category === 'seasonal')
        },
        isVisible: true,
        order: 4
      },
      {
        type: 'care_guides',
        id: 'care-resources',
        title: 'Expert Care Resources',
        content: {
          headline: 'Master Plant Care with Professional Guidance',
          description: 'Download our comprehensive care guides written by certified horticulturists',
          guides: careGuidesData.slice(0, 3),
          viewAllLink: '/care-guides'
        },
        isVisible: true,
        order: 5
      }
    ]
  },

  about: {
    id: 'about',
    title: 'About Blooms & Botanicals',
    description: 'Meet our team of certified horticulturists and discover our passion for exceptional plant care.',
    seo: {
      title: 'About Us - Expert Horticulturists & Plant Care Specialists | Blooms & Botanicals',
      description: 'Meet our certified horticulturists and master gardeners. Learn about our commitment to plant excellence, sustainable practices, and expert botanical guidance.',
      keywords: ['horticulturists', 'plant experts', 'master gardener', 'botanical expertise', 'plant nursery team', 'sustainable gardening']
    },
    blocks: [
      {
        type: 'mission',
        id: 'our-mission',
        title: 'Our Mission',
        content: {
          headline: 'Cultivating Plant Success Through Expert Knowledge',
          description: 'Since 2018, we\'ve been dedicated to connecting plant enthusiasts with premium specimens and the horticultural expertise needed for thriving gardens.',
          mission: 'To provide exceptional plants and professional guidance that empowers every gardener to create beautiful, sustainable growing spaces.',
          values: [
            {
              title: 'Horticultural Excellence',
              description: 'Our certified master horticulturists ensure every plant meets the highest quality standards'
            },
            {
              title: 'Sustainable Practices',
              description: 'We champion organic growing methods and environmentally responsible plant sourcing'
            },
            {
              title: 'Educational Commitment',
              description: 'Comprehensive care resources and personalized guidance for gardening success'
            },
            {
              title: 'Local Expertise',
              description: 'Deep knowledge of regional growing conditions, hardiness zones, and seasonal care requirements'
            }
          ],
          image: '/images/greenhouse-interior.jpg'
        },
        isVisible: true,
        order: 1
      },
      {
        type: 'team',
        id: 'our-team',
        title: 'Meet Our Experts',
        content: {
          headline: 'Meet Our Plant Care Specialists',
          description: 'Our team combines decades of horticultural expertise with a passion for helping plants and people thrive together.',
          team: teamData
        },
        isVisible: true,
        order: 2
      },
      {
        type: 'testimonials',
        id: 'testimonials',
        title: 'What Our Customers Say',
        content: {
          headline: 'Trusted by Plant Enthusiasts',
          testimonials: [
            {
              quote: 'Sarah\'s expertise saved my struggling fiddle leaf fig. The detailed care plan and follow-up support were invaluable.',
              author: 'Jennifer M.',
              location: 'Austin, TX',
              rating: 5
            },
            {
              quote: 'The plant selection is outstanding, but the real value is in their horticultural knowledge. Every recommendation has thrived.',
              author: 'David L.',
              location: 'Portland, OR',
              rating: 5
            },
            {
              quote: 'As a beginner gardener, their care guides and patient guidance gave me the confidence to create my indoor jungle.',
              author: 'Maria S.',
              location: 'Denver, CO',
              rating: 5
            }
          ]
        },
        isVisible: true,
        order: 3
      }
    ]
  },

  contact: {
    id: 'contact',
    title: 'Contact Our Plant Experts',
    description: 'Get in touch with our horticultural specialists for plant care questions and consultations.',
    seo: {
      title: 'Contact Us - Plant Care Experts & Horticultural Consultations | Blooms & Botanicals',
      description: 'Contact our certified horticulturists for plant care questions, consultations, and expert guidance. Visit our greenhouse or schedule a consultation.',
      keywords: ['plant care consultation', 'horticulture experts', 'plant care questions', 'garden consultation', 'plant help']
    },
    blocks: [
      {
        type: 'contact',
        id: 'contact-info',
        title: 'Get in Touch',
        content: {
          headline: 'Expert Plant Guidance When You Need It',
          description: 'Our certified horticulturists are here to help with all your plant care questions and consultations.',
          contactMethods: [
            {
              type: 'phone',
              label: 'Phone',
              value: '(555) 123-GROW',
              description: 'Speak with a plant expert Monday-Saturday 9AM-6PM'
            },
            {
              type: 'email',
              label: 'Email',
              value: 'experts@bloomsandbotanicals.com',
              description: 'Get detailed plant care advice within 24 hours'
            },
            {
              type: 'location',
              label: 'Visit Our Greenhouse',
              value: '1234 Garden Way, Green Valley, TX 78745',
              description: 'Open Tuesday-Sunday 9AM-7PM, closed Mondays'
            }
          ],
          services: [
            {
              name: 'Plant Health Consultations',
              description: 'Diagnostic services for struggling plants with treatment recommendations',
              duration: '30 minutes',
              price: '$45'
            },
            {
              name: 'Garden Design Consultation',
              description: 'Professional landscape and garden planning with plant selection guidance',
              duration: '60 minutes',
              price: '$85'
            },
            {
              name: 'Houseplant Styling Session',
              description: 'Interior plant design and care consultation for optimal placement',
              duration: '45 minutes',
              price: '$65'
            }
          ]
        },
        isVisible: true,
        order: 1
      }
    ]
  },

  'privacy-policy': {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    description: 'How we protect and handle your personal information.',
    seo: {
      title: 'Privacy Policy - Data Protection & Customer Information | Blooms & Botanicals',
      description: 'Learn how Blooms & Botanicals protects your personal information and handles customer data responsibly.',
      keywords: ['privacy policy', 'data protection', 'customer information', 'plant shop privacy']
    },
    blocks: [
      {
        type: 'legal',
        id: 'privacy-content',
        title: 'Privacy Policy',
        content: {
          headline: 'Privacy Policy',
          lastUpdated: '2024-09-01',
          sections: [
            {
              title: 'Information We Collect',
              content: 'We collect information you provide directly to us, such as when you create an account, make a purchase, subscribe to our newsletter, or contact us for plant care consultations.'
            },
            {
              title: 'How We Use Your Information',
              content: 'We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and communicate with you about plants, services, and events.'
            },
            {
              title: 'Information Sharing and Disclosure',
              content: 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.'
            },
            {
              title: 'Data Security',
              content: 'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.'
            },
            {
              title: 'Your Rights',
              content: 'You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us.'
            },
            {
              title: 'Contact Information',
              content: 'If you have any questions about this Privacy Policy, please contact us at privacy@bloomsandbotanicals.com or (555) 123-GROW.'
            }
          ]
        },
        isVisible: true,
        order: 1
      }
    ]
  },

  'terms-of-service': {
    id: 'terms-of-service',
    title: 'Terms of Service',
    description: 'Terms and conditions for using our plant care services and making purchases.',
    seo: {
      title: 'Terms of Service - Plant Purchase & Care Service Terms | Blooms & Botanicals',
      description: 'Terms and conditions for purchasing plants and using horticultural services at Blooms & Botanicals.',
      keywords: ['terms of service', 'plant purchase terms', 'plant care services', 'plant shop terms']
    },
    blocks: [
      {
        type: 'legal',
        id: 'terms-content',
        title: 'Terms of Service',
        content: {
          headline: 'Terms of Service',
          lastUpdated: '2024-09-01',
          sections: [
            {
              title: 'Acceptance of Terms',
              content: 'By accessing and using our services, you accept and agree to be bound by the terms and provision of this agreement.'
            },
            {
              title: 'Plant Care and Guarantees',
              content: 'We guarantee our plants are healthy at the time of purchase. Plant survival depends on proper care following our provided guidelines. We offer a 30-day plant replacement guarantee with proof of following care instructions.'
            },
            {
              title: 'Consultation Services',
              content: 'Our horticultural consultations provide expert advice based on the information you provide. Plant health outcomes depend on implementation of recommendations and environmental factors beyond our control.'
            },
            {
              title: 'Shipping and Returns',
              content: 'Live plants are carefully packaged for safe transport. Returns are accepted within 30 days for plants that arrive damaged or significantly different from description.'
            },
            {
              title: 'Care Guide Accuracy',
              content: 'Our care guides reflect current horticultural best practices. Local growing conditions may require adjustments to recommendations. Consult with our experts for location-specific guidance.'
            },
            {
              title: 'Limitation of Liability',
              content: 'We provide plant care guidance based on horticultural expertise, but cannot guarantee plant survival due to variables in care, environment, and individual plant health.'
            },
            {
              title: 'Contact Information',
              content: 'For questions about these terms, contact us at legal@bloomsandbotanicals.com or (555) 123-GROW.'
            }
          ]
        },
        isVisible: true,
        order: 1
      }
    ]
  }
};

// Helper functions for filtering and organizing data
export const getPlantsByCategory = (category: PlantData['category']): PlantData[] => {
  return plantsData.filter(plant => plant.category === category);
};

export const getPlantsByCareLevel = (careLevel: PlantData['careLevel']): PlantData[] => {
  return plantsData.filter(plant => plant.careLevel === careLevel);
};

export const getFeaturedPlants = (): PlantData[] => {
  return plantsData.filter(plant => plant.featured);
};

export const getInStockPlants = (): PlantData[] => {
  return plantsData.filter(plant => plant.inStock);
};

export const getCareGuidesByCategory = (category: CareGuide['category']): CareGuide[] => {
  return careGuidesData.filter(guide => guide.category === category);
};

// Export all data for easy access
export default {
  plants: plantsData,
  careGuides: careGuidesData,
  team: teamData,
  pages: plantShopContent
};