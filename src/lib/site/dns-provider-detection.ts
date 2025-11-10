/**
 * Detects the DNS provider for a domain
 * In production, this would perform actual DNS lookups
 */

export type DNSProvider =
  | 'cloudflare'
  | 'godaddy'
  | 'namecheap'
  | 'google'
  | 'route53'
  | 'other'
  | 'unknown'

interface ProviderPattern {
  provider: DNSProvider
  nameserverPatterns: RegExp[]
}

const providerPatterns: ProviderPattern[] = [
  {
    provider: 'cloudflare',
    nameserverPatterns: [
      /cloudflare\.com$/i,
      /ns-cloud-[a-z]\d+\.googledomains\.com$/i
    ]
  },
  {
    provider: 'godaddy',
    nameserverPatterns: [
      /domaincontrol\.com$/i,
      /secureserver\.net$/i
    ]
  },
  {
    provider: 'namecheap',
    nameserverPatterns: [
      /namecheap\.com$/i,
      /registrar-servers\.com$/i
    ]
  },
  {
    provider: 'google',
    nameserverPatterns: [
      /googledomains\.com$/i,
      /google\.com$/i
    ]
  },
  {
    provider: 'route53',
    nameserverPatterns: [
      /awsdns-\d+\.(com|net|org|co\.uk)$/i
    ]
  }
]

export async function detectDNSProvider(domain: string): Promise<DNSProvider> {
  try {
    // In production, this would perform actual DNS lookups
    // For development, we'll simulate provider detection

    // Remove protocol and www if present
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')

    // Simulate detection based on domain patterns (for demo purposes)
    if (cleanDomain.includes('.cloudflare')) {
      return 'cloudflare'
    }
    if (cleanDomain.includes('godaddy')) {
      return 'godaddy'
    }
    if (cleanDomain.includes('namecheap')) {
      return 'namecheap'
    }

    // Random provider for demo
    const providers: DNSProvider[] = ['cloudflare', 'godaddy', 'namecheap', 'google', 'route53', 'other']
    return providers[Math.floor(Math.random() * providers.length)]
  } catch (error) {
    console.error('Error detecting DNS provider:', error)
    return 'unknown'
  }
}

export interface ProviderInstructions {
  title: string
  steps: string[]
  docsUrl?: string
  videoUrl?: string
  notes?: string[]
}

export function getProviderInstructions(provider: DNSProvider): ProviderInstructions {
  const instructions: Record<DNSProvider, ProviderInstructions> = {
    cloudflare: {
      title: 'Cloudflare DNS Configuration',
      steps: [
        'Log in to your Cloudflare dashboard at https://dash.cloudflare.com',
        'Select your domain from the list',
        'Click on "DNS" in the left sidebar',
        'Click "Add record" button',
        'Add the CNAME record shown below (set Proxy status to DNS only - gray cloud)',
        'Add the TXT verification record shown below',
        'Click "Save" for each record',
        'DNS propagation typically takes 1-5 minutes with Cloudflare'
      ],
      docsUrl: 'https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/',
      notes: [
        'Make sure the proxy status is set to "DNS only" (gray cloud) for the CNAME record',
        'Cloudflare typically propagates DNS changes within minutes'
      ]
    },
    godaddy: {
      title: 'GoDaddy DNS Configuration',
      steps: [
        'Log in to your GoDaddy account at https://godaddy.com',
        'Go to "My Products" and find your domain',
        'Click "DNS" next to your domain',
        'Click "Add" in the DNS Management page',
        'Select "CNAME" type and add the record shown below',
        'Click "Add" again and select "TXT" type for the verification record',
        'Save all changes',
        'DNS propagation typically takes 30 minutes to 2 hours'
      ],
      docsUrl: 'https://www.godaddy.com/help/add-a-cname-record-19236',
      notes: [
        'GoDaddy may take longer for DNS propagation',
        'Make sure to save changes after adding each record'
      ]
    },
    namecheap: {
      title: 'Namecheap DNS Configuration',
      steps: [
        'Log in to your Namecheap account at https://namecheap.com',
        'Go to "Domain List" in your dashboard',
        'Click "Manage" next to your domain',
        'Select "Advanced DNS" tab',
        'Click "Add New Record"',
        'Add the CNAME record with the values shown below',
        'Add another new record for the TXT verification',
        'Save all changes',
        'DNS propagation typically takes 30 minutes to 2 hours'
      ],
      docsUrl: 'https://www.namecheap.com/support/knowledgebase/article.aspx/9646/2237/how-to-create-a-cname-record-for-your-domain/',
      notes: [
        'Use "@" for the host field if configuring the root domain',
        'TTL can be set to "Automatic" or the recommended value'
      ]
    },
    google: {
      title: 'Google Domains DNS Configuration',
      steps: [
        'Log in to Google Domains at https://domains.google.com',
        'Click on your domain name',
        'Select "DNS" from the left menu',
        'Scroll to "Custom resource records"',
        'Add the CNAME record with the values below',
        'Add the TXT verification record',
        'Click "Save" after adding each record',
        'DNS propagation typically takes 10-30 minutes'
      ],
      docsUrl: 'https://support.google.com/domains/answer/3290350',
      notes: [
        'Google Domains has fast DNS propagation',
        'Use @ for root domain or subdomain name for specific subdomains'
      ]
    },
    route53: {
      title: 'AWS Route 53 DNS Configuration',
      steps: [
        'Log in to AWS Console at https://console.aws.amazon.com',
        'Navigate to Route 53 service',
        'Click on "Hosted zones" and select your domain',
        'Click "Create record"',
        'Add the CNAME record with "Simple routing" policy',
        'Create another record for the TXT verification',
        'Review and create the records',
        'DNS propagation is typically immediate with Route 53'
      ],
      docsUrl: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html',
      notes: [
        'Route 53 changes propagate globally within 60 seconds',
        'Make sure you\'re in the correct hosted zone for your domain'
      ]
    },
    other: {
      title: 'Generic DNS Configuration',
      steps: [
        'Log in to your DNS provider\'s control panel',
        'Navigate to DNS management or DNS settings for your domain',
        'Look for an option to add DNS records (may be called "DNS Records", "Zone Editor", or "Advanced DNS")',
        'Add a new CNAME record with the values shown below',
        'Add a new TXT record for verification',
        'Save your changes',
        'Wait for DNS propagation (typically 30 minutes to 48 hours)'
      ],
      notes: [
        'Different providers use different terminology',
        'Contact your provider\'s support if you can\'t find DNS settings',
        'Some providers may require you to remove existing records first'
      ]
    },
    unknown: {
      title: 'DNS Configuration',
      steps: [
        'Log in to your domain registrar or DNS provider',
        'Find the DNS management section',
        'Add the DNS records shown below',
        'Save your changes and wait for propagation'
      ],
      notes: [
        'If you\'re unsure of your DNS provider, check where you purchased your domain',
        'You can use tools like "whois" to find your domain registrar'
      ]
    }
  }

  return instructions[provider]
}