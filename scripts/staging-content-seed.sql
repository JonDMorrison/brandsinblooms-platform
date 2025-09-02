-- Staging Content Seed SQL
-- This script removes existing content and adds demo pages for Development Site and Green Thumbs Gardens
-- Site IDs:
-- - Development Site: 00000000-0000-0000-0000-000000000001
-- - Green Thumbs Gardens: 14a3a999-b698-437f-90a8-f89842f10d08

-- =====================================================
-- STEP 1: Remove existing content for both sites
-- =====================================================
DELETE FROM content 
WHERE site_id IN (
  '00000000-0000-0000-0000-000000000001',
  '14a3a999-b698-437f-90a8-f89842f10d08'
);

-- =====================================================
-- STEP 2: Insert demo pages for Development Site
-- =====================================================

-- Landing Page Demo
INSERT INTO content (site_id, title, slug, content_type, content, is_published, is_featured, meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Landing Page Demo',
  'landing-page-demo',
  'page',
  '{
    "version": "1.0",
    "layout": "landing",
    "sections": {
      "hero": {
        "type": "hero",
        "visible": true,
        "order": 0,
        "data": {
          "content": "<h1>Transform Your Business Today</h1>\n<p class=\"lead\">Powerful solutions that drive real results for modern teams.</p>\n<p>Join thousands of companies already using our platform to accelerate growth.</p>",
          "items": [
            {"id": "cta-1", "title": "Get Started Free", "url": "/signup"},
            {"id": "cta-2", "title": "Watch Demo", "url": "/demo"}
          ]
        }
      },
      "features": {
        "type": "features",
        "visible": true,
        "order": 1,
        "data": {
          "items": [
            {"id": "f1", "title": "Lightning Fast", "content": "Optimized performance with sub-second response times.", "icon": "Zap", "order": 0},
            {"id": "f2", "title": "Enterprise Security", "content": "Bank-level encryption to protect your data.", "icon": "Shield", "order": 1},
            {"id": "f3", "title": "Easy Deployment", "content": "Go from concept to production in minutes.", "icon": "Rocket", "order": 2},
            {"id": "f4", "title": "Global Scale", "content": "Distributed infrastructure ensures reliability.", "icon": "Globe", "order": 3},
            {"id": "f5", "title": "Privacy First", "content": "GDPR compliant with full data ownership.", "icon": "Lock", "order": 4},
            {"id": "f6", "title": "Customer Success", "content": "Dedicated support team ensures your success.", "icon": "Heart", "order": 5}
          ]
        }
      }
    }
  }'::jsonb,
  true,
  true,
  '{"layout": "landing", "description": "Professional landing page with hero, features, testimonials, and pricing", "seededDemo": true}'::jsonb,
  NOW(),
  NOW()
);

-- Blog Article Demo
INSERT INTO content (site_id, title, slug, content_type, content, is_published, is_featured, meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Blog Article Demo',
  'blog-article-demo',
  'blog_post',
  '{
    "version": "1.0",
    "layout": "blog",
    "sections": {
      "header": {
        "type": "hero",
        "visible": true,
        "order": 0,
        "data": {
          "content": "<h1>Digital Transformation: A Strategic Guide</h1>\n<p class=\"text-xl\">Insights and strategies for navigating the modern business landscape</p>"
        }
      },
      "content": {
        "type": "richText",
        "visible": true,
        "order": 1,
        "data": {
          "content": "<h2>Introduction</h2>\n<p>In today''s rapidly evolving digital landscape, businesses face unprecedented challenges and opportunities.</p>\n\n<h2>The Current State</h2>\n<p>Digital transformation has moved from a competitive advantage to a business necessity. Organizations that fail to adapt risk becoming obsolete.</p>\n\n<h2>Key Drivers of Change</h2>\n<ul>\n<li>Customer Expectations</li>\n<li>Technological Advancement</li>\n<li>Market Dynamics</li>\n<li>Regulatory Requirements</li>\n</ul>\n\n<h2>Conclusion</h2>\n<p>The journey of transformation is unique for every organization. By understanding your specific challenges and opportunities, you can chart a path toward sustainable success.</p>"
        }
      }
    }
  }'::jsonb,
  true,
  false,
  '{"layout": "blog", "description": "Rich blog post with comprehensive content and formatting", "seededDemo": true}'::jsonb,
  NOW(),
  NOW()
);

-- Portfolio Demo
INSERT INTO content (site_id, title, slug, content_type, content, is_published, is_featured, meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Portfolio Demo',
  'portfolio-demo',
  'page',
  '{
    "version": "1.0",
    "layout": "portfolio",
    "sections": {
      "header": {
        "type": "hero",
        "visible": true,
        "order": 0,
        "data": {
          "content": "<h1>Our Portfolio</h1>\n<p>Showcasing our best work and successful projects</p>"
        }
      },
      "gallery": {
        "type": "gallery",
        "visible": true,
        "order": 1,
        "data": {
          "items": [
            {"id": "p1", "title": "Project Alpha", "content": "Enterprise solution for Fortune 500 company", "image": "/api/placeholder/800/600", "order": 0},
            {"id": "p2", "title": "Project Beta", "content": "Mobile app with 1M+ downloads", "image": "/api/placeholder/800/600", "order": 1},
            {"id": "p3", "title": "Project Gamma", "content": "Award-winning design system", "image": "/api/placeholder/800/600", "order": 2},
            {"id": "p4", "title": "Project Delta", "content": "AI-powered analytics platform", "image": "/api/placeholder/800/600", "order": 3},
            {"id": "p5", "title": "Project Epsilon", "content": "E-commerce platform processing $10M+", "image": "/api/placeholder/800/600", "order": 4},
            {"id": "p6", "title": "Project Zeta", "content": "Healthcare solution serving 100K+ patients", "image": "/api/placeholder/800/600", "order": 5}
          ]
        }
      }
    }
  }'::jsonb,
  true,
  false,
  '{"layout": "portfolio", "description": "Beautiful portfolio showcase with project gallery", "seededDemo": true}'::jsonb,
  NOW(),
  NOW()
);

-- About Us Demo
INSERT INTO content (site_id, title, slug, content_type, content, is_published, is_featured, meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'About Us Demo',
  'about-us-demo',
  'page',
  '{
    "version": "1.0",
    "layout": "about",
    "sections": {
      "header": {
        "type": "hero",
        "visible": true,
        "order": 0,
        "data": {
          "content": "<h1>About Our Company</h1>\n<p>Building the future of digital transformation since 2020</p>"
        }
      },
      "mission": {
        "type": "mission",
        "visible": true,
        "order": 1,
        "data": {
          "content": "<h2>Our Mission</h2>\n<p>We believe in empowering businesses with tools that make complex tasks simple, enabling teams to focus on what truly matters: innovation and growth.</p>"
        }
      },
      "values": {
        "type": "values",
        "visible": true,
        "order": 2,
        "data": {
          "items": [
            {"id": "v1", "title": "Integrity", "content": "We build trust through transparency", "icon": "Shield", "order": 0},
            {"id": "v2", "title": "Innovation", "content": "We constantly push boundaries", "icon": "Lightbulb", "order": 1},
            {"id": "v3", "title": "Collaboration", "content": "Great things happen when we work together", "icon": "Users", "order": 2},
            {"id": "v4", "title": "Excellence", "content": "We strive for excellence in everything", "icon": "Award", "order": 3}
          ]
        }
      },
      "team": {
        "type": "team",
        "visible": true,
        "order": 3,
        "data": {
          "items": [
            {"id": "t1", "title": "Alexandra Chen", "subtitle": "CEO", "content": "15+ years in tech leadership", "image": "/api/placeholder/400/400", "order": 0},
            {"id": "t2", "title": "Marcus Johnson", "subtitle": "CTO", "content": "Former Google engineer", "image": "/api/placeholder/400/400", "order": 1},
            {"id": "t3", "title": "Sofia Rodriguez", "subtitle": "VP Product", "content": "Product visionary", "image": "/api/placeholder/400/400", "order": 2},
            {"id": "t4", "title": "David Kim", "subtitle": "Head of Design", "content": "Award-winning designer", "image": "/api/placeholder/400/400", "order": 3}
          ]
        }
      }
    }
  }'::jsonb,
  true,
  false,
  '{"layout": "about", "description": "Company story with mission, values, and team profiles", "seededDemo": true}'::jsonb,
  NOW(),
  NOW()
);

-- Product Page Demo
INSERT INTO content (site_id, title, slug, content_type, content, is_published, is_featured, meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Product Page Demo',
  'product-page-demo',
  'page',
  '{
    "version": "1.0",
    "layout": "product",
    "sections": {
      "header": {
        "type": "hero",
        "visible": true,
        "order": 0,
        "data": {
          "content": "<h1>Professional Platform Suite</h1>\n<p>Everything you need to run your business in one integrated platform</p>"
        }
      },
      "features": {
        "type": "features",
        "visible": true,
        "order": 1,
        "data": {
          "items": [
            {"id": "pf1", "title": "All-in-One", "content": "Complete business solution", "icon": "Package", "order": 0},
            {"id": "pf2", "title": "Scalable", "content": "Grows with your business", "icon": "TrendingUp", "order": 1},
            {"id": "pf3", "title": "Secure", "content": "Enterprise-grade security", "icon": "Lock", "order": 2}
          ]
        }
      },
      "specifications": {
        "type": "specifications",
        "visible": true,
        "order": 2,
        "data": {
          "content": "<h3>Technical Specifications</h3>\n<ul>\n<li>Cloud-based SaaS</li>\n<li>99.9% SLA</li>\n<li>RESTful & GraphQL APIs</li>\n<li>SOC 2 Type II certified</li>\n<li>500+ integrations</li>\n</ul>"
        }
      },
      "pricing": {
        "type": "pricing",
        "visible": true,
        "order": 3,
        "data": {
          "items": [
            {"id": "pr1", "title": "Starter", "subtitle": "$49/mo", "content": "Perfect for small teams", "order": 0},
            {"id": "pr2", "title": "Professional", "subtitle": "$199/mo", "content": "For growing businesses", "order": 1},
            {"id": "pr3", "title": "Enterprise", "subtitle": "Custom", "content": "Tailored solutions", "order": 2}
          ]
        }
      }
    }
  }'::jsonb,
  true,
  false,
  '{"layout": "product", "description": "Detailed product showcase with specifications and pricing", "seededDemo": true}'::jsonb,
  NOW(),
  NOW()
);

-- Contact Page Demo
INSERT INTO content (site_id, title, slug, content_type, content, is_published, is_featured, meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Contact Page Demo',
  'contact-page-demo',
  'page',
  '{
    "version": "1.0",
    "layout": "contact",
    "sections": {
      "header": {
        "type": "hero",
        "visible": true,
        "order": 0,
        "data": {
          "content": "<h1>Get in Touch</h1>\n<p>We''d love to hear from you</p>"
        }
      },
      "form": {
        "type": "form",
        "visible": true,
        "order": 1,
        "data": {
          "fields": [
            {"id": "name", "type": "text", "label": "Full Name", "required": true, "order": 0},
            {"id": "email", "type": "email", "label": "Email", "required": true, "order": 1},
            {"id": "message", "type": "textarea", "label": "Message", "required": true, "order": 2}
          ]
        }
      },
      "features": {
        "type": "features",
        "visible": true,
        "order": 2,
        "data": {
          "items": [
            {"id": "c1", "title": "Email", "content": "hello@example.com", "icon": "Mail", "order": 0},
            {"id": "c2", "title": "Phone", "content": "+1 (555) 123-4567", "icon": "Phone", "order": 1},
            {"id": "c3", "title": "Office", "content": "123 Business Ave", "icon": "MapPin", "order": 2}
          ]
        }
      }
    }
  }'::jsonb,
  true,
  false,
  '{"layout": "contact", "description": "Contact form with business information and location details", "seededDemo": true}'::jsonb,
  NOW(),
  NOW()
);

-- Custom Page Demo
INSERT INTO content (site_id, title, slug, content_type, content, is_published, is_featured, meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Custom Page Demo',
  'custom-page-demo',
  'page',
  '{
    "version": "1.0",
    "layout": "other",
    "sections": {
      "hero": {
        "type": "hero",
        "visible": true,
        "order": 0,
        "data": {
          "content": "<h1>Custom Page Layout</h1>\n<p>This flexible layout allows you to create any type of content</p>"
        }
      }
    }
  }'::jsonb,
  true,
  false,
  '{"layout": "other", "description": "Flexible custom layout with mixed content sections", "seededDemo": true}'::jsonb,
  NOW(),
  NOW()
);

-- =====================================================
-- STEP 3: Insert demo pages for Green Thumbs Gardens
-- =====================================================

-- Landing Page for Green Thumbs Gardens
INSERT INTO content (site_id, title, slug, content_type, content, is_published, is_featured, meta_data, created_at, updated_at)
VALUES (
  '14a3a999-b698-437f-90a8-f89842f10d08',
  'Welcome to Green Thumbs Gardens',
  'home',
  'page',
  '{
    "version": "1.0",
    "layout": "landing",
    "sections": {
      "hero": {
        "type": "hero",
        "visible": true,
        "order": 0,
        "data": {
          "content": "<h1>Green Thumbs Gardens</h1>\n<p class=\"lead\">Your premier destination for beautiful flowers and expert gardening services.</p>\n<p>Transforming outdoor spaces into botanical paradises since 1995.</p>",
          "items": [
            {"id": "cta-1", "title": "Shop Flowers", "url": "/products"},
            {"id": "cta-2", "title": "Book Consultation", "url": "/contact"}
          ]
        }
      },
      "features": {
        "type": "features",
        "visible": true,
        "order": 1,
        "data": {
          "items": [
            {"id": "f1", "title": "Fresh Daily", "content": "Flowers delivered fresh from local growers every morning.", "icon": "Flower", "order": 0},
            {"id": "f2", "title": "Expert Design", "content": "Professional floral arrangements for any occasion.", "icon": "Palette", "order": 1},
            {"id": "f3", "title": "Garden Services", "content": "Complete landscaping and garden maintenance.", "icon": "Trees", "order": 2},
            {"id": "f4", "title": "Event Flowers", "content": "Stunning arrangements for weddings and events.", "icon": "Heart", "order": 3},
            {"id": "f5", "title": "Plant Care", "content": "Expert advice and plant care services.", "icon": "Sprout", "order": 4},
            {"id": "f6", "title": "Same Day Delivery", "content": "Quick delivery throughout the metro area.", "icon": "Truck", "order": 5}
          ]
        }
      }
    }
  }'::jsonb,
  true,
  true,
  '{"layout": "landing", "description": "Main landing page for Green Thumbs Gardens flower shop", "seededDemo": true}'::jsonb,
  NOW(),
  NOW()
);

-- About Page for Green Thumbs Gardens
INSERT INTO content (site_id, title, slug, content_type, content, is_published, is_featured, meta_data, created_at, updated_at)
VALUES (
  '14a3a999-b698-437f-90a8-f89842f10d08',
  'About Green Thumbs Gardens',
  'about',
  'page',
  '{
    "version": "1.0",
    "layout": "about",
    "sections": {
      "header": {
        "type": "hero",
        "visible": true,
        "order": 0,
        "data": {
          "content": "<h1>Our Story</h1>\n<p>Three generations of passion for flowers and gardens</p>"
        }
      },
      "mission": {
        "type": "mission",
        "visible": true,
        "order": 1,
        "data": {
          "content": "<h2>Our Mission</h2>\n<p>To bring the beauty of nature into every home and garden, creating lasting memories through the language of flowers and exceptional horticultural expertise.</p>"
        }
      },
      "values": {
        "type": "values",
        "visible": true,
        "order": 2,
        "data": {
          "items": [
            {"id": "v1", "title": "Quality", "content": "Only the finest flowers and plants", "icon": "Award", "order": 0},
            {"id": "v2", "title": "Sustainability", "content": "Eco-friendly practices and local sourcing", "icon": "Leaf", "order": 1},
            {"id": "v3", "title": "Community", "content": "Supporting local growers and events", "icon": "Users", "order": 2},
            {"id": "v4", "title": "Expertise", "content": "Decades of horticultural knowledge", "icon": "BookOpen", "order": 3}
          ]
        }
      },
      "team": {
        "type": "team",
        "visible": true,
        "order": 3,
        "data": {
          "items": [
            {"id": "t1", "title": "Margaret Green", "subtitle": "Founder & Head Florist", "content": "30+ years of floral design", "image": "/api/placeholder/400/400", "order": 0},
            {"id": "t2", "title": "Robert Green", "subtitle": "Head Gardener", "content": "Master gardener certification", "image": "/api/placeholder/400/400", "order": 1},
            {"id": "t3", "title": "Emily Chen", "subtitle": "Event Coordinator", "content": "Specializes in wedding florals", "image": "/api/placeholder/400/400", "order": 2},
            {"id": "t4", "title": "James Martinez", "subtitle": "Landscape Designer", "content": "Award-winning garden designs", "image": "/api/placeholder/400/400", "order": 3}
          ]
        }
      }
    }
  }'::jsonb,
  true,
  false,
  '{"layout": "about", "description": "About page for Green Thumbs Gardens with history and team", "seededDemo": true}'::jsonb,
  NOW(),
  NOW()
);

-- Services Page for Green Thumbs Gardens
INSERT INTO content (site_id, title, slug, content_type, content, is_published, is_featured, meta_data, created_at, updated_at)
VALUES (
  '14a3a999-b698-437f-90a8-f89842f10d08',
  'Our Services',
  'services',
  'page',
  '{
    "version": "1.0",
    "layout": "product",
    "sections": {
      "header": {
        "type": "hero",
        "visible": true,
        "order": 0,
        "data": {
          "content": "<h1>Professional Garden Services</h1>\n<p>Complete solutions for your floral and gardening needs</p>"
        }
      },
      "features": {
        "type": "features",
        "visible": true,
        "order": 1,
        "data": {
          "items": [
            {"id": "s1", "title": "Floral Design", "content": "Custom arrangements for all occasions", "icon": "Flower2", "order": 0},
            {"id": "s2", "title": "Garden Design", "content": "Complete landscape planning and installation", "icon": "Trees", "order": 1},
            {"id": "s3", "title": "Maintenance", "content": "Regular garden care and seasonal updates", "icon": "Scissors", "order": 2}
          ]
        }
      },
      "pricing": {
        "type": "pricing",
        "visible": true,
        "order": 2,
        "data": {
          "items": [
            {"id": "p1", "title": "Basic Care", "subtitle": "$99/month", "content": "Monthly garden maintenance", "order": 0},
            {"id": "p2", "title": "Premium Care", "subtitle": "$249/month", "content": "Weekly service with seasonal plantings", "order": 1},
            {"id": "p3", "title": "Full Service", "subtitle": "Custom Quote", "content": "Complete garden management", "order": 2}
          ]
        }
      }
    }
  }'::jsonb,
  true,
  false,
  '{"layout": "product", "description": "Services offered by Green Thumbs Gardens", "seededDemo": true}'::jsonb,
  NOW(),
  NOW()
);

-- Contact Page for Green Thumbs Gardens
INSERT INTO content (site_id, title, slug, content_type, content, is_published, is_featured, meta_data, created_at, updated_at)
VALUES (
  '14a3a999-b698-437f-90a8-f89842f10d08',
  'Contact Us',
  'contact',
  'page',
  '{
    "version": "1.0",
    "layout": "contact",
    "sections": {
      "header": {
        "type": "hero",
        "visible": true,
        "order": 0,
        "data": {
          "content": "<h1>Visit Our Garden Center</h1>\n<p>We''re here to help with all your floral and gardening needs</p>"
        }
      },
      "form": {
        "type": "form",
        "visible": true,
        "order": 1,
        "data": {
          "fields": [
            {"id": "name", "type": "text", "label": "Your Name", "required": true, "order": 0},
            {"id": "email", "type": "email", "label": "Email Address", "required": true, "order": 1},
            {"id": "phone", "type": "tel", "label": "Phone Number", "required": false, "order": 2},
            {"id": "service", "type": "select", "label": "Service Needed", "required": true, "order": 3},
            {"id": "message", "type": "textarea", "label": "How can we help?", "required": true, "order": 4}
          ]
        }
      },
      "features": {
        "type": "features",
        "visible": true,
        "order": 2,
        "data": {
          "items": [
            {"id": "c1", "title": "Garden Center", "content": "123 Bloom Street, Garden City", "icon": "MapPin", "order": 0},
            {"id": "c2", "title": "Phone", "content": "(555) 234-5678", "icon": "Phone", "order": 1},
            {"id": "c3", "title": "Email", "content": "hello@greenthumbsgardens.com", "icon": "Mail", "order": 2},
            {"id": "c4", "title": "Hours", "content": "Mon-Sat 8am-6pm, Sun 10am-4pm", "icon": "Clock", "order": 3}
          ]
        }
      }
    }
  }'::jsonb,
  true,
  false,
  '{"layout": "contact", "description": "Contact information and form for Green Thumbs Gardens", "seededDemo": true}'::jsonb,
  NOW(),
  NOW()
);

-- Blog Post for Green Thumbs Gardens
INSERT INTO content (site_id, title, slug, content_type, content, is_published, is_featured, meta_data, created_at, updated_at)
VALUES (
  '14a3a999-b698-437f-90a8-f89842f10d08',
  'Spring Gardening Tips',
  'spring-gardening-tips',
  'blog_post',
  '{
    "version": "1.0",
    "layout": "blog",
    "sections": {
      "header": {
        "type": "hero",
        "visible": true,
        "order": 0,
        "data": {
          "content": "<h1>Essential Spring Gardening Tips</h1>\n<p class=\"text-xl\">Get your garden ready for the growing season</p>"
        }
      },
      "content": {
        "type": "richText",
        "visible": true,
        "order": 1,
        "data": {
          "content": "<h2>Preparing Your Garden for Spring</h2>\n<p>As winter fades and spring approaches, it''s time to prepare your garden for the growing season. Here are essential tips to ensure your garden thrives.</p>\n\n<h2>1. Clean and Clear</h2>\n<p>Remove dead plants, fallen leaves, and debris that accumulated over winter. This prevents disease and gives new plants room to grow.</p>\n\n<h2>2. Test Your Soil</h2>\n<p>Spring is the perfect time to test your soil pH and nutrient levels. Most plants prefer slightly acidic to neutral soil (pH 6.0-7.0).</p>\n\n<h2>3. Start Seeds Indoors</h2>\n<p>Get a head start on the season by starting seeds indoors 6-8 weeks before the last frost date.</p>\n\n<h2>4. Prune and Trim</h2>\n<p>Prune dead branches from trees and shrubs before new growth begins. This encourages healthy growth and improves plant shape.</p>\n\n<h2>5. Mulch Your Beds</h2>\n<p>Apply a 2-3 inch layer of organic mulch to retain moisture, suppress weeds, and regulate soil temperature.</p>\n\n<h2>Conclusion</h2>\n<p>With these tips, your garden will be ready to burst into life this spring. Visit our garden center for all your spring gardening supplies!</p>"
        }
      }
    }
  }'::jsonb,
  true,
  false,
  '{"layout": "blog", "description": "Helpful tips for spring gardening from Green Thumbs Gardens", "seededDemo": true}'::jsonb,
  NOW(),
  NOW()
);

-- =====================================================
-- STEP 4: Verify the seed was successful
-- =====================================================
SELECT 
  s.name as site_name,
  COUNT(c.id) as page_count,
  array_agg(c.title ORDER BY c.created_at) as page_titles
FROM sites s
LEFT JOIN content c ON s.id = c.site_id
WHERE s.id IN (
  '00000000-0000-0000-0000-000000000001',
  '14a3a999-b698-437f-90a8-f89842f10d08'
)
GROUP BY s.id, s.name
ORDER BY s.name;