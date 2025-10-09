/**
 * Seed Content Templates
 *
 * Template functions for generating seed data content.
 * These are shared between the generation script and the app.
 */

import type { PageContent } from './types'

// Re-export from templates.ts
export { getPrivacyPolicyTemplate, getTermsOfServiceTemplate } from './templates'

// ============================================================================
// PLANT CARE TEMPLATES
// ============================================================================

export function getSeasonalGuideTemplate(businessName: string, location: string): PageContent {
  return {
    version: '1.0',
    layout: 'other',
    sections: {
      header: {
        type: 'header',
        order: 1,
        visible: true,
        data: {
          headline: 'Seasonal Plant Care Guide',
          subheadline: `Expert seasonal care tips for ${location}`,
        },
        settings: {
          backgroundColor: 'default',
        },
      },
      features: {
        type: 'features',
        order: 2,
        visible: true,
        data: {
          headline: 'Year-Round Plant Care Success',
          description: 'Master seasonal care essentials to keep your garden thriving through every season',
          features: [
            { icon: 'Flower', title: 'Spring preparation and planting guidance' },
            { icon: 'Sun', title: 'Summer watering and maintenance tips' },
            { icon: 'Snowflake', title: 'Fall harvest and winter protection strategies' },
          ],
        },
        settings: {
          backgroundColor: 'default',
        },
      },
      richText: {
        type: 'richText',
        order: 3,
        visible: true,
        data: {
          headline: '',
          content: `<h2>Spring (March - May)</h2>
<p>Spring is the perfect time to prepare your garden for the growing season ahead. As temperatures warm and daylight increases, plants emerge from dormancy and begin active growth.</p>

<h3>Key Spring Tasks</h3>
<ul>
<li><strong>Start planting:</strong> Begin planting cool-season vegetables and annual flowers after the last frost date</li>
<li><strong>Prune:</strong> Remove dead or damaged branches from trees and shrubs</li>
<li><strong>Fertilize:</strong> Apply balanced fertilizer to perennials and established plants</li>
<li><strong>Mulch:</strong> Add fresh mulch to retain moisture and suppress weeds</li>
<li><strong>Divide perennials:</strong> Early spring is ideal for dividing and transplanting overcrowded perennials</li>
</ul>

<h2>Summer (June - August)</h2>
<p>Summer brings peak growing season with warm temperatures and long days. Focus on maintenance and consistent care to keep plants thriving through the heat.</p>

<h3>Key Summer Tasks</h3>
<ul>
<li><strong>Water deeply:</strong> Provide consistent moisture, especially during hot, dry periods</li>
<li><strong>Deadhead flowers:</strong> Remove spent blooms to encourage continued flowering</li>
<li><strong>Monitor pests:</strong> Check regularly for signs of insect damage or disease</li>
<li><strong>Harvest:</strong> Pick vegetables and herbs at peak ripeness</li>
<li><strong>Shade protection:</strong> Provide temporary shade for heat-sensitive plants</li>
</ul>`,
        },
        settings: {
          backgroundColor: 'default',
        },
      },
    },
  }
}

export function getCompanyTemplate(businessName: string): PageContent {
  return {
    version: '1.0',
    layout: 'other',
    sections: {
      header: {
        type: 'header',
        order: 1,
        visible: true,
        data: {
          headline: `About ${businessName}`,
          subheadline: 'Learn more about our company',
        },
        settings: {
          backgroundColor: 'default',
        },
      },
      richText: {
        type: 'richText',
        order: 2,
        visible: true,
        data: {
          headline: 'Our Story',
          content: `<p>${businessName} is dedicated to providing exceptional service and products to our customers. We believe in sustainable practices, quality craftsmanship, and building lasting relationships with our community.</p>`,
        },
        settings: {
          backgroundColor: 'default',
        },
      },
    },
  }
}

export function getWateringGuideTemplate(businessName: string): PageContent {
  return {
    version: '1.0',
    layout: 'other',
    sections: {
      header: {
        type: 'header',
        order: 1,
        visible: true,
        data: {
          headline: 'Watering 101',
          subheadline: 'Master the fundamentals of plant watering',
        },
        settings: {
          backgroundColor: 'default',
        },
      },
      richText: {
        type: 'richText',
        order: 2,
        visible: true,
        data: {
          headline: 'Essential Watering Tips',
          content: `<h2>How Much Water Do Plants Need?</h2>
<p>Most plants need about 1 inch of water per week, but this varies based on plant type, climate, and soil conditions.</p>

<h3>Best Practices</h3>
<ul>
<li>Water deeply and less frequently rather than shallow daily watering</li>
<li>Water in the early morning to reduce evaporation</li>
<li>Check soil moisture before watering</li>
<li>Adjust watering based on weather and season</li>
</ul>`,
        },
        settings: {
          backgroundColor: 'default',
        },
      },
    },
  }
}

export function getLightingGuideTemplate(businessName: string): PageContent {
  return {
    version: '1.0',
    layout: 'other',
    sections: {
      header: {
        type: 'header',
        order: 1,
        visible: true,
        data: {
          headline: 'Light Requirements Explained',
          subheadline: 'Understanding plant lighting needs',
        },
        settings: {
          backgroundColor: 'default',
        },
      },
      richText: {
        type: 'richText',
        order: 2,
        visible: true,
        data: {
          headline: 'Light Levels',
          content: `<h2>Understanding Light Requirements</h2>
<p>Different plants have different light requirements. Here's how to interpret common light descriptions:</p>

<h3>Light Categories</h3>
<ul>
<li><strong>Full Sun:</strong> 6+ hours of direct sunlight daily</li>
<li><strong>Partial Shade:</strong> 3-6 hours of direct sunlight</li>
<li><strong>Full Shade:</strong> Less than 3 hours of direct sunlight</li>
</ul>`,
        },
        settings: {
          backgroundColor: 'default',
        },
      },
    },
  }
}

export function getSoilGuideTemplate(businessName: string): PageContent {
  return {
    version: '1.0',
    layout: 'other',
    sections: {
      header: {
        type: 'header',
        order: 1,
        visible: true,
        data: {
          headline: 'Soil & Repotting Guide',
          subheadline: 'Create the perfect growing environment',
        },
        settings: {
          backgroundColor: 'default',
        },
      },
      richText: {
        type: 'richText',
        order: 2,
        visible: true,
        data: {
          headline: 'Soil Basics',
          content: `<h2>Choosing the Right Soil</h2>
<p>Quality soil is the foundation of healthy plants. Good potting mix should be well-draining yet retain adequate moisture.</p>

<h3>When to Repot</h3>
<ul>
<li>Roots growing out of drainage holes</li>
<li>Water running straight through the pot</li>
<li>Plant becomes top-heavy or unstable</li>
<li>Soil depletes quickly or stays too wet</li>
</ul>`,
        },
        settings: {
          backgroundColor: 'default',
        },
      },
    },
  }
}

export function getPestsGuideTemplate(businessName: string): PageContent {
  return {
    version: '1.0',
    layout: 'other',
    sections: {
      header: {
        type: 'header',
        order: 1,
        visible: true,
        data: {
          headline: 'Common Pests & Problems',
          subheadline: 'Identify and solve plant issues',
        },
        settings: {
          backgroundColor: 'default',
        },
      },
      richText: {
        type: 'richText',
        order: 2,
        visible: true,
        data: {
          headline: 'Pest Prevention',
          content: `<h2>Common Plant Pests</h2>
<p>Early detection is key to managing plant pests. Regular inspection helps catch problems before they become severe.</p>

<h3>Common Issues</h3>
<ul>
<li><strong>Aphids:</strong> Small, soft-bodied insects that cluster on new growth</li>
<li><strong>Spider Mites:</strong> Tiny pests that create fine webbing</li>
<li><strong>Fungus Gnats:</strong> Small flies around soil surface</li>
<li><strong>Scale:</strong> Small, immobile bumps on stems and leaves</li>
</ul>`,
        },
        settings: {
          backgroundColor: 'default',
        },
      },
    },
  }
}
