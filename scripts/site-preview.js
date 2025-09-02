#!/usr/bin/env node

/**
 * Site Preview Helper
 * 
 * Shows how to preview customer sites locally
 */

const subdomain = process.argv[2] || 'demo';

console.log(`
╔════════════════════════════════════════════════════════════╗
║              🌸 Brands in Blooms Site Preview 🌸            ║
╚════════════════════════════════════════════════════════════╝

To preview the customer site for "${subdomain}", use one of these methods:

1. EASIEST - Subdomain on localhost:
   → Open: http://${subdomain}.localhost:3001

2. Custom local domain (requires /etc/hosts edit):
   → Add to /etc/hosts: 127.0.0.1 ${subdomain}.local
   → Open: http://${subdomain}.local:3001

3. Test with different sites:
   → http://garden-center.localhost:3001
   → http://my-nursery.localhost:3001
   → http://test-site.localhost:3001

Make sure your dev server is running:
   pnpm dev

Note: The site must exist in your database with the matching subdomain.
`);