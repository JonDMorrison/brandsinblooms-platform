// Plant Content Data - Authentic plant business content with expert terminology
// Task 3: Authentic Plant Content Implementation

export interface PlantVariety {
  id: string;
  commonName: string;
  scientificName: string;
  category: 'houseplant' | 'outdoor' | 'succulent' | 'herb' | 'native';
  careLevel: 'beginner' | 'intermediate' | 'advanced';
  lightRequirement: 'low light' | 'bright indirect' | 'full sun' | 'partial shade';
  wateringFrequency: string;
  hardinessZones?: string;
  soilType: string;
  features: string[];
  description: string;
  careInstructions: string;
  price: number;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  specialization: string;
  credentials: string[];
  bio: string;
  experience: string;
  image?: string;
}

export interface CompanyStory {
  founding: {
    year: number;
    story: string;
    mission: string;
  };
  expertise: {
    certifications: string[];
    specializations: string[];
    experience: string;
  };
  philosophy: string;
  commitment: string;
}

export interface SustainabilityPractice {
  id: string;
  title: string;
  description: string;
  impact: string;
  metrics?: string;
}

// Authentic Plant Varieties with Expert Care Information
export const plantVarieties: PlantVariety[] = [
  // Houseplants
  {
    id: 'monstera-deliciosa',
    commonName: 'Swiss Cheese Plant',
    scientificName: 'Monstera deliciosa',
    category: 'houseplant',
    careLevel: 'beginner',
    lightRequirement: 'bright indirect',
    wateringFrequency: 'Weekly, when top 2 inches of soil are dry',
    soilType: 'Well-draining potting mix with perlite and bark',
    features: ['Air purifying', 'Fenestrated leaves', 'Climbing habit', 'Pet-friendly alternative available'],
    description: 'This iconic tropical houseplant develops stunning natural holes (fenestrations) as it matures, creating living art for your indoor jungle. Native to Central American rainforests.',
    careInstructions: 'Provide bright, indirect light and consistent moisture. Support with moss pole for optimal growth. Increase humidity to 50-60% for best leaf development. Wipe leaves monthly with damp cloth.',
    price: 45
  },
  {
    id: 'fiddle-leaf-fig',
    commonName: 'Fiddle Leaf Fig',
    scientificName: 'Ficus lyrata',
    category: 'houseplant',
    careLevel: 'intermediate',
    lightRequirement: 'bright indirect',
    wateringFrequency: 'Weekly, deep watering when soil surface is dry',
    soilType: 'Fast-draining potting soil with bark amendment',
    features: ['Statement plant', 'Large sculptural leaves', 'Tree-form available', 'Instagram favorite'],
    description: 'The crown jewel of modern plant parenthood, featuring broad, violin-shaped leaves that create dramatic architectural presence in any space.',
    careInstructions: 'Maintain consistent watering schedule and avoid temperature fluctuations. Rotate weekly for even growth. Prune to encourage branching. Watch for signs of overwatering (brown spots).',
    price: 85
  },
  {
    id: 'snake-plant-laurentii',
    commonName: 'Snake Plant',
    scientificName: 'Sansevieria trifasciata \'Laurentii\'',
    category: 'houseplant',
    careLevel: 'beginner',
    lightRequirement: 'low light',
    wateringFrequency: 'Monthly, less in winter',
    soilType: 'Cactus and succulent potting mix',
    features: ['Nearly indestructible', 'Air purifying', 'Drought tolerant', 'Low light champion'],
    description: 'The ultimate beginner plant for those starting their plant wellness journey. This architectural beauty thrives on neglect while actively cleaning your indoor air.',
    careInstructions: 'Allow soil to completely dry between waterings. Tolerates low light but grows faster in bright, indirect light. Avoid overwatering - root rot is the only way to kill this survivor.',
    price: 35
  },

  // Outdoor Plants
  {
    id: 'japanese-maple',
    commonName: 'Japanese Maple',
    scientificName: 'Acer palmatum',
    category: 'outdoor',
    careLevel: 'intermediate',
    lightRequirement: 'partial shade',
    wateringFrequency: 'Deep watering 2-3 times weekly in growing season',
    hardinessZones: 'USDA Zones 5-8',
    soilType: 'Well-draining, slightly acidic soil with organic matter',
    features: ['Four-season interest', 'Stunning fall color', 'Compact growth', 'Specimen tree'],
    description: 'Prized for exquisite foliage and graceful branching structure, this ornamental tree provides year-round garden interest with spring emergence, summer beauty, and spectacular autumn display.',
    careInstructions: 'Plant in protected location with morning sun and afternoon shade. Mulch heavily to retain moisture and protect shallow roots. Prune in late fall/winter. Provide winter protection in Zone 5.',
    price: 125
  },
  {
    id: 'purple-coneflower',
    commonName: 'Purple Coneflower',
    scientificName: 'Echinacea purpurea',
    category: 'native',
    careLevel: 'beginner',
    lightRequirement: 'full sun',
    wateringFrequency: 'Deep watering weekly, drought tolerant once established',
    hardinessZones: 'USDA Zones 3-9',
    soilType: 'Well-draining soil, tolerates poor conditions',
    features: ['Native pollinator magnet', 'Medicinal properties', 'Drought tolerant', 'Long bloom period'],
    description: 'This native prairie wildflower is essential for pollinator gardens, attracting butterflies, bees, and birds while providing natural beauty with minimal maintenance requirements.',
    careInstructions: 'Plant in full sun for best flowering. Deadhead spent blooms to encourage continued flowering or leave for winter bird food. Divide every 3-4 years in spring.',
    price: 18
  },

  // Succulents
  {
    id: 'jade-plant',
    commonName: 'Jade Plant',
    scientificName: 'Crassula ovata',
    category: 'succulent',
    careLevel: 'beginner',
    lightRequirement: 'bright indirect',
    wateringFrequency: 'Every 2-3 weeks, less in winter',
    soilType: 'Fast-draining cactus and succulent mix',
    features: ['Lucky plant', 'Long-lived', 'Easy propagation', 'Bonsai potential'],
    description: 'Known as the "money tree" or "friendship plant," this succulent develops a tree-like structure over time and is believed to bring prosperity and good fortune.',
    careInstructions: 'Water deeply but infrequently, allowing soil to dry completely. Provide bright light for compact growth and possible flowering. Pinch growing tips to encourage branching.',
    price: 25
  },
  {
    id: 'barrel-cactus',
    commonName: 'Golden Barrel Cactus',
    scientificName: 'Echinocactus grusonii',
    category: 'succulent',
    careLevel: 'beginner',
    lightRequirement: 'full sun',
    wateringFrequency: 'Monthly in growing season, minimal in winter',
    hardinessZones: 'USDA Zones 9-11 (container elsewhere)',
    soilType: 'Extremely well-draining cactus mix with sand and perlite',
    features: ['Architectural form', 'Golden spines', 'Slow growing', 'Heat tolerant'],
    description: 'This sculptural desert specimen creates striking focal points in xeriscape gardens and modern container displays with its perfect spherical form and golden spination.',
    careInstructions: 'Provide maximum sun exposure and excellent drainage. Water sparingly - overwatering is fatal. Protect from frost. Handle with leather gloves due to sharp spines.',
    price: 55
  },

  // Herbs
  {
    id: 'organic-basil',
    commonName: 'Sweet Basil',
    scientificName: 'Ocimum basilicum',
    category: 'herb',
    careLevel: 'beginner',
    lightRequirement: 'full sun',
    wateringFrequency: 'Daily in hot weather, keep soil consistently moist',
    soilType: 'Rich, well-draining potting soil with compost',
    features: ['Culinary essential', 'Organic certified', 'Continuous harvest', 'Aromatic'],
    description: 'Grown using certified organic methods, this culinary herb is essential for fresh cooking and provides the foundation for homemade pesto, caprese, and Mediterranean dishes.',
    careInstructions: 'Pinch flowers to encourage leaf production. Harvest regularly by cutting stems above leaf pairs. Provide consistent moisture but avoid waterlogged soil. Companion plant with tomatoes.',
    price: 12
  },
  {
    id: 'rosemary-tuscan-blue',
    commonName: 'Tuscan Blue Rosemary',
    scientificName: 'Rosmarinus officinalis \'Tuscan Blue\'',
    category: 'herb',
    careLevel: 'intermediate',
    lightRequirement: 'full sun',
    wateringFrequency: 'Weekly, allow soil to dry between waterings',
    hardinessZones: 'USDA Zones 7-10',
    soilType: 'Well-draining, sandy soil with good air circulation',
    features: ['Upright growth habit', 'Blue flowers', 'Drought tolerant', 'Mediterranean native'],
    description: 'This upright rosemary variety produces striking blue flowers and provides year-round culinary harvests with its intensely aromatic, needle-like foliage.',
    careInstructions: 'Plant in full sun with excellent drainage. Prune after flowering to maintain shape. In colder zones, grow in containers and overwinter indoors. Avoid overwatering.',
    price: 16
  }
];

// Professional Team Profiles with Plant Specializations
export const teamMembers: TeamMember[] = [
  {
    id: 'sarah-botanist',
    name: 'Dr. Sarah Chen',
    title: 'Head Horticulturist & Founder',
    specialization: 'Native Plant Ecology and Sustainable Growing Practices',
    credentials: [
      'Ph.D. in Plant Biology, UC Davis',
      'Certified Professional Horticulturist (CPH)',
      'Master Gardener Volunteer Coordinator',
      'Organic Growing Specialist Certification'
    ],
    bio: 'With over 15 years of experience in sustainable horticulture, Dr. Chen founded Brands in Blooms to bridge the gap between scientific plant knowledge and accessible home gardening.',
    experience: 'Former research scientist at the California Native Plant Society, specializing in drought-tolerant landscaping and pollinator habitat restoration. Published author of "The Urban Native Garden" and frequent speaker at horticultural conferences.',
    image: '/team/sarah-chen.jpg'
  },
  {
    id: 'marcus-propagation',
    name: 'Marcus Rodriguez',
    title: 'Propagation Specialist',
    specialization: 'Plant Propagation and Greenhouse Management',
    credentials: [
      'B.S. in Horticulture, Cal Poly San Luis Obispo',
      'Greenhouse Management Certification',
      'Certified Crop Advisor (CCA)',
      'Integrated Pest Management Specialist'
    ],
    bio: 'Marcus oversees our propagation facility and ensures every plant meets our quality standards before reaching customers. His expertise in tissue culture and traditional propagation methods keeps our inventory healthy and robust.',
    experience: '12 years managing commercial greenhouse operations, specializing in sustainable propagation techniques and biological pest control methods. Expert in hydroponic systems and climate control optimization.',
    image: '/team/marcus-rodriguez.jpg'
  },
  {
    id: 'elena-houseplants',
    name: 'Elena Kowalski',
    title: 'Indoor Plant Specialist',
    specialization: 'Houseplant Care and Indoor Air Quality',
    credentials: [
      'Certified Interior Landscape Technician',
      'NASA Clean Air Study Researcher',
      'Certified Horticultural Therapist',
      'Plant Styling and Design Certificate'
    ],
    bio: 'Elena helps customers create thriving indoor jungles and understands the science behind plant parenthood. Her passion for biophilic design and plant wellness drives our educational content.',
    experience: 'Former interior plantscaper for Fortune 500 companies, specializing in low-light plant solutions and air-purifying plant selection. Certified in horticultural therapy and plant-human health benefits research.',
    image: '/team/elena-kowalski.jpg'
  },
  {
    id: 'james-landscapes',
    name: 'James Thompson',
    title: 'Landscape Design Consultant',
    specialization: 'Native Landscaping and Drought-Tolerant Gardens',
    credentials: [
      'Licensed Landscape Architect',
      'Certified Sustainable Landscape Professional',
      'Xeriscaping Design Specialist',
      'Native Plant Society Board Member'
    ],
    bio: 'James designs sustainable landscapes that work with nature rather than against it. His expertise in native plant communities and water-wise gardening helps customers create beautiful, eco-friendly outdoor spaces.',
    experience: '20 years designing award-winning drought-tolerant landscapes throughout California. Specialist in native plant restoration projects and pollinator habitat creation for residential and commercial properties.',
    image: '/team/james-thompson.jpg'
  }
];

// Authentic Company Story with Horticultural Expertise
export const companyStory: CompanyStory = {
  founding: {
    year: 2018,
    story: 'Founded in the heart of California\'s Central Valley, Brands in Blooms emerged from Dr. Sarah Chen\'s frustration with the disconnect between botanical science and everyday gardening. After years of research in plant ecology and sustainable agriculture, she recognized that most plant retailers lacked the deep horticultural knowledge needed to truly serve plant enthusiasts.',
    mission: 'To democratize plant expertise by providing scientifically-backed growing advice alongside carefully curated plant selections, empowering every customer to succeed in their plant parenthood journey.'
  },
  expertise: {
    certifications: [
      'Certified Professional Horticulturist (CPH)',
      'Organic Growing Specialist Certification',
      'Sustainable Landscape Professional',
      'Master Gardener Program Affiliate',
      'California Native Plant Society Member'
    ],
    specializations: [
      'Native plant ecology and habitat restoration',
      'Sustainable growing methods and organic pest management',
      'Indoor air quality and biophilic design',
      'Drought-tolerant landscaping and xeriscaping',
      'Plant propagation and tissue culture techniques'
    ],
    experience: 'Our team brings over 50 combined years of professional horticultural experience, from university research to commercial greenhouse management, landscape architecture to horticultural therapy.'
  },
  philosophy: 'We believe that successful plant parenthood starts with understanding each plant\'s natural habitat and needs. Rather than selling plants as decorative objects, we share the botanical knowledge that transforms plant care from guesswork into confident, science-based practice.',
  commitment: 'Every plant we offer comes with detailed care instructions based on scientific research and real-world testing. We grow many varieties in our own greenhouse facility, allowing us to provide first-hand experience with each plant\'s specific requirements and growth patterns.'
};

// Sustainability Practices with Environmental Impact Claims
export const sustainabilityPractices: SustainabilityPractice[] = [
  {
    id: 'carbon-negative-shipping',
    title: 'Carbon-Negative Shipping Program',
    description: 'We partner with carbon offset initiatives to ensure every shipment removes more CO2 from the atmosphere than it produces through transportation.',
    impact: 'Each order removes an average of 2.5 lbs of CO2 from the atmosphere',
    metrics: 'Over 10,000 lbs of CO2 offset annually through reforestation partnerships'
  },
  {
    id: 'zero-peat-growing',
    title: 'Peat-Free Growing Media',
    description: 'Our custom potting mixes use coconut coir, composted bark, and perlite instead of environmentally destructive peat moss, protecting vital bog ecosystems.',
    impact: 'Preserves critical carbon-storing peatland habitats',
    metrics: '100% of our growing media is sustainably sourced and renewable'
  },
  {
    id: 'pollinator-corridor',
    title: 'Native Plant Pollinator Corridor Initiative',
    description: 'For every native plant sold, we donate a portion of proceeds to establish pollinator corridors using locally-sourced native seeds and plantings.',
    impact: 'Supports declining bee populations and butterfly migrations',
    metrics: 'Over 5,000 native plants donated to habitat restoration projects'
  },
  {
    id: 'plastic-free-packaging',
    title: 'Plastic-Free Packaging Solutions',
    description: 'All packaging materials are either compostable, recyclable, or reusable. Plant pots are made from rice hulls and other agricultural waste products.',
    impact: 'Eliminates single-use plastics from the plant buying experience',
    metrics: '99% of packaging materials biodegrade within 180 days'
  },
  {
    id: 'water-conservation',
    title: 'Closed-Loop Water System',
    description: 'Our greenhouse facility recycles 95% of irrigation water through biofilter systems and rainwater collection, minimizing freshwater consumption.',
    impact: 'Reduces agricultural water usage in drought-prone regions',
    metrics: 'Saves over 50,000 gallons of freshwater annually'
  },
  {
    id: 'local-sourcing',
    title: 'Regional Growing Network',
    description: 'We work with local growers within 200 miles to reduce transportation emissions and support regional agricultural communities.',
    impact: 'Strengthens local food systems and reduces carbon footprint',
    metrics: '80% of plants sourced within 200-mile radius'
  },
  {
    id: 'education-outreach',
    title: 'Community Education and Outreach',
    description: 'Free workshops, school garden programs, and master gardener training help communities develop sustainable growing practices.',
    impact: 'Multiplies environmental benefits through education',
    metrics: 'Over 2,000 people trained in sustainable gardening practices annually'
  }
];

// Content Blocks for Easy Integration
export const contentBlocks = {
  heroMessages: [
    'Cultivate your urban jungle with expert-guided plant parenthood',
    'Where botanical science meets beautiful living spaces',
    'Grow with confidence using science-backed plant care',
    'Transform your home into a thriving ecosystem'
  ],
  
  expertiseStatements: [
    'Certified horticulturists with 50+ years combined experience',
    'Science-backed care instructions for every plant variety',
    'Sustainable growing practices rooted in ecological research',
    'Native plant specialists supporting local ecosystems'
  ],
  
  careGuidance: [
    'Understanding hardiness zones for successful outdoor planting',
    'Creating optimal light conditions for houseplant success',
    'Well-draining soil: the foundation of healthy root systems',
    'Seasonal care adjustments for year-round plant health'
  ],
  
  plantParenthoodLanguage: [
    'Begin your plant parenthood journey with confidence',
    'Nurture your green living space with expert guidance',
    'Create your personal urban jungle oasis',
    'Embrace plant wellness as part of your daily routine'
  ]
};

// Export all content for easy access
export const plantContentData = {
  plantVarieties,
  teamMembers,
  companyStory,
  sustainabilityPractices,
  contentBlocks
};

export default plantContentData;