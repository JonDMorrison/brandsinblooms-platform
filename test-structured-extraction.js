#!/usr/bin/env node

/**
 * Test script for structured content extraction
 *
 * Usage: node test-structured-extraction.js
 */

const { extractBusinessInfo } = require('./src/lib/scraping/content-extractor.ts');

// Sample HTML with business hours, services, and testimonials
const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Green Thumb Gardens</title>
</head>
<body>
    <div class="business-hours">
        <h3>Our Hours</h3>
        <ul>
            <li>Monday: 9am - 6pm</li>
            <li>Tuesday: 9am - 6pm</li>
            <li>Wednesday: 9am - 6pm</li>
            <li>Thursday: 9am - 8pm</li>
            <li>Friday: 9am - 8pm</li>
            <li>Saturday: 8am - 5pm</li>
            <li>Sunday: Closed</li>
        </ul>
    </div>

    <div class="services">
        <div class="service-item">
            <h4 class="service-name">Garden Design Consultation</h4>
            <p class="description">Professional garden planning and design</p>
            <span class="price">$150/hour</span>
        </div>
        <div class="service-item">
            <h4 class="service-name">Plant Installation</h4>
            <p class="description">We plant your purchases for you</p>
            <span class="price">Starting at $50</span>
        </div>
    </div>

    <div class="testimonials">
        <div class="testimonial">
            <p class="review-text">Amazing service! They transformed my garden into a paradise.</p>
            <cite class="author">Jane Smith</cite>
            <span class="role">Homeowner</span>
        </div>
        <div class="testimonial">
            <blockquote>The best plant shop in town. Knowledgeable staff and healthy plants.</blockquote>
            <footer class="customer">John Doe, Local Resident</footer>
        </div>
    </div>
</body>
</html>
`;

// Test extraction
console.log('Testing structured content extraction...\n');

try {
    const result = extractBusinessInfo(testHTML, 'https://example.com');

    if (result.structuredContent) {
        console.log('✅ Structured content extracted successfully!\n');

        if (result.structuredContent.businessHours) {
            console.log('Business Hours:', result.structuredContent.businessHours.length, 'entries');
            result.structuredContent.businessHours.forEach(h => {
                console.log(`  - ${h.day}: ${h.closed ? 'Closed' : h.hours}`);
            });
        }

        if (result.structuredContent.services) {
            console.log('\nServices:', result.structuredContent.services.length, 'items');
            result.structuredContent.services.forEach(s => {
                console.log(`  - ${s.name}: ${s.price || 'No price'}`);
            });
        }

        if (result.structuredContent.testimonials) {
            console.log('\nTestimonials:', result.structuredContent.testimonials.length, 'reviews');
            result.structuredContent.testimonials.forEach(t => {
                console.log(`  - "${t.content.substring(0, 50)}..." by ${t.name || 'Anonymous'}`);
            });
        }
    } else {
        console.log('❌ No structured content extracted');
    }
} catch (error) {
    console.error('❌ Error:', error.message);
}