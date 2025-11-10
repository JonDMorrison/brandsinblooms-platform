/**
 * DNS Configuration Types and Utilities
 */

export type DomainStatus = 'not_started' | 'pending_verification' | 'verified' | 'failed' | 'disconnected'

export interface DnsRecord {
  type: 'CNAME' | 'TXT' | 'A' | 'AAAA'
  name: string
  value: string
  ttl: number
}

export interface DnsRecords {
  cname: DnsRecord
  txt: DnsRecord
}

export interface DnsProvider {
  id: string
  name: string
  nameservers: string[]
  documentationUrl?: string
}

export interface DomainVerificationResult {
  verified: boolean
  cnameValid: boolean
  txtValid: boolean
  errors: string[]
  details: {
    expectedCname?: string
    actualCname?: string
    expectedTxt?: string
    actualTxt?: string
  }
}

export interface DomainInitializationResult {
  success: boolean
  domain: string
  status: DomainStatus
  provider?: string
  verificationToken: string
  dnsRecords: DnsRecords
  error?: string
}

export interface DomainStatusResult {
  domain: string | null
  status: DomainStatus
  provider?: string | null
  lastCheckAt?: string | null
  verifiedAt?: string | null
  nextCheckAvailable?: string
  dnsRecords?: DnsRecords | null
  error?: string | null
}

// DNS Provider patterns for detection
export const DNS_PROVIDERS: Record<string, DnsProvider> = {
  cloudflare: {
    id: 'cloudflare',
    name: 'Cloudflare',
    nameservers: ['cloudflare.com', 'ns.cloudflare.com'],
    documentationUrl: 'https://developers.cloudflare.com/dns/manage-dns-records/'
  },
  godaddy: {
    id: 'godaddy',
    name: 'GoDaddy',
    nameservers: ['domaincontrol.com'],
    documentationUrl: 'https://www.godaddy.com/help/add-a-cname-record-19236'
  },
  namecheap: {
    id: 'namecheap',
    name: 'Namecheap',
    nameservers: ['registrar-servers.com', 'namecheaphosting.com'],
    documentationUrl: 'https://www.namecheap.com/support/knowledgebase/article.aspx/9646/'
  },
  google: {
    id: 'google',
    name: 'Google Domains',
    nameservers: ['googledomains.com'],
    documentationUrl: 'https://support.google.com/domains/answer/9211383'
  },
  route53: {
    id: 'route53',
    name: 'Amazon Route 53',
    nameservers: ['awsdns'],
    documentationUrl: 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ResourceRecordTypes.html'
  },
  digitalocean: {
    id: 'digitalocean',
    name: 'DigitalOcean',
    nameservers: ['digitalocean.com'],
    documentationUrl: 'https://docs.digitalocean.com/products/networking/dns/how-to/manage-records/'
  },
  squarespace: {
    id: 'squarespace',
    name: 'Squarespace',
    nameservers: ['squarespace.com', 'sqspcdn.com'],
    documentationUrl: 'https://support.squarespace.com/hc/en-us/articles/360002101888'
  },
  wix: {
    id: 'wix',
    name: 'Wix',
    nameservers: ['wixdns.net'],
    documentationUrl: 'https://support.wix.com/en/article/adding-dns-records-in-your-wix-account'
  },
  bluehost: {
    id: 'bluehost',
    name: 'Bluehost',
    nameservers: ['bluehost.com'],
    documentationUrl: 'https://www.bluehost.com/help/article/dns-records-explained'
  },
  hostgator: {
    id: 'hostgator',
    name: 'HostGator',
    nameservers: ['hostgator.com'],
    documentationUrl: 'https://www.hostgator.com/help/article/manage-dns-records-with-hostgator-cpanel'
  }
}

// Rate limiting constants
export const DNS_CHECK_RATE_LIMIT_SECONDS = 60 // 1 minute between checks

// DNS record defaults
export const PROXY_DOMAIN = 'proxy.blooms.cc'
export const VERIFICATION_PREFIX = '_blooms-verify'
export const DEFAULT_TTL = 300 // 5 minutes