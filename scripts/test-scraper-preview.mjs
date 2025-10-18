#!/usr/bin/env node

/**
 * Test script for the dev-only scraper preview endpoint
 *
 * Usage: node scripts/test-scraper-preview.mjs <website-url>
 * Example: node scripts/test-scraper-preview.mjs https://example.com
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api/dev/scraper-preview';

async function testScraperPreview(websiteUrl) {
  console.log('🔍 Testing scraper preview endpoint...');
  console.log('📍 URL:', websiteUrl);
  console.log('');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add authentication here
        // Either a Bearer token or cookies from a logged-in session
      },
      body: JSON.stringify({
        websiteUrl,
        verbose: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed:', response.status, response.statusText);
      console.error('Response:', errorText);
      return;
    }

    const data = await response.json();

    if (data.success) {
      const result = data.data;

      console.log('✅ Scraping Phase');
      console.log(`   Duration: ${result.scraping.duration}ms`);
      console.log(`   Pages Found: ${result.scraping.metrics.totalPagesFound}`);
      console.log(`   Pages Scraped: ${result.scraping.metrics.totalPagesScraped}`);
      console.log(`   Failed Pages: ${result.scraping.metrics.failedPages}`);
      console.log(`   Total Data: ${(result.scraping.metrics.totalDataSize / 1024).toFixed(2)} KB`);
      console.log('');

      console.log('✅ Analysis Phase');
      console.log(`   Duration: ${result.analysis.duration}ms`);
      console.log(`   Logo Found: ${result.analysis.extracted.hasLogo ? 'Yes' : 'No'}`);
      if (result.analysis.extracted.logoUrl) {
        console.log(`   Logo URL: ${result.analysis.extracted.logoUrl}`);
      }
      console.log(`   Emails: ${result.analysis.extracted.emailsCount}`);
      console.log(`   Phones: ${result.analysis.extracted.phonesCount}`);
      console.log(`   Brand Colors: ${result.analysis.extracted.brandColorsCount}`);
      console.log(`   Social Links: ${result.analysis.extracted.socialLinksCount}`);
      console.log(`   Has Hero Section: ${result.analysis.extracted.hasHeroSection ? 'Yes' : 'No'}`);
      console.log(`   Services: ${result.analysis.extracted.servicesCount || 0}`);
      console.log(`   Testimonials: ${result.analysis.extracted.testimonialsCount || 0}`);
      console.log('');

      console.log('✅ LLM Context');
      console.log(`   Context Size: ${(result.llmContext.contextSize / 1024).toFixed(2)} KB`);
      console.log(`   Estimated Tokens: ~${result.llmContext.estimatedTokens}`);
      console.log('');

      console.log('✅ Recommended Pages:');
      result.analysis.result.recommendedPages.forEach(page => {
        console.log(`   - ${page}`);
      });
      console.log('');

      console.log('📊 Execution Metadata');
      console.log(`   Total Duration: ${result.execution.totalDuration}ms`);
      console.log(`   Environment: ${result.execution.environment}`);
      console.log(`   Timestamp: ${result.execution.timestamp}`);

      if (result.warnings && result.warnings.length > 0) {
        console.log('');
        console.log('⚠️  Warnings:');
        result.warnings.forEach(warning => {
          console.log(`   - ${warning}`);
        });
      }

      // Save full response to file for inspection
      const fs = await import('fs/promises');
      const outputFile = `scraper-preview-${Date.now()}.json`;
      await fs.writeFile(outputFile, JSON.stringify(result, null, 2));
      console.log('');
      console.log(`📁 Full response saved to: ${outputFile}`);

    } else {
      console.error('❌ API returned error:', data.error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Main execution
const websiteUrl = process.argv[2];

if (!websiteUrl) {
  console.error('❌ Please provide a website URL as an argument');
  console.error('Usage: node scripts/test-scraper-preview.mjs <website-url>');
  console.error('Example: node scripts/test-scraper-preview.mjs https://example.com');
  process.exit(1);
}

testScraperPreview(websiteUrl);