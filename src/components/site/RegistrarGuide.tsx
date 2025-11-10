'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Settings, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/src/components/ui/button'

export type Registrar =
  | 'cloudflare'
  | 'godaddy'
  | 'namecheap'
  | 'route53'
  | 'google'
  | 'digitalocean'
  | 'squarespace'
  | 'wix'
  | 'other'

interface RegistrarGuideProps {
  registrar: Registrar
  domain: string
  cnameValue: string
  txtName: string
  txtValue: string
}

interface RegistrarInstructionSet {
  title: string
  docsUrl: string
  steps: React.ReactNode
  notes?: string[]
}

export function RegistrarGuide({
  registrar,
  domain,
  cnameValue,
  txtName,
  txtValue,
}: RegistrarGuideProps) {
  const getInstructions = (): RegistrarInstructionSet => {
    switch (registrar) {
      case 'cloudflare':
        return {
          title: 'Cloudflare',
          docsUrl: 'https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/',
          steps: (
            <ol className="space-y-3 list-decimal list-inside">
              <li className="pl-2">
                <span className="font-medium">Log in to your Cloudflare account</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Visit{' '}
                  <a
                    href="https://dash.cloudflare.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    dash.cloudflare.com
                  </a>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Select your domain</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Click on <code className="bg-gray-100 px-1 rounded">{domain}</code> in your websites list
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Navigate to DNS settings</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Click on <strong>DNS</strong> in the left sidebar, then <strong>Records</strong>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the CNAME record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Click <strong>Add record</strong></li>
                  <li>• Type: Select <strong>CNAME</strong></li>
                  <li>
                    • Name: Enter <code className="bg-gray-100 px-1 rounded">@</code> or subdomain
                  </li>
                  <li>
                    • Target: Enter <code className="bg-gray-100 px-1 rounded">{cnameValue}</code>
                  </li>
                  <li>
                    • Proxy status: Click the cloud icon to turn it <strong>gray (DNS only)</strong>
                  </li>
                  <li>• TTL: Select <strong>Auto</strong></li>
                  <li>• Click <strong>Save</strong></li>
                </ul>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the TXT record for verification</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Click <strong>Add record</strong> again</li>
                  <li>• Type: Select <strong>TXT</strong></li>
                  <li>
                    • Name: Enter{' '}
                    <code className="bg-gray-100 px-1 rounded">{txtName.replace(`.${domain}`, '')}</code>
                  </li>
                  <li>
                    • Content: Paste{' '}
                    <code className="bg-gray-100 px-1 rounded text-xs break-all">{txtValue}</code>
                  </li>
                  <li>• TTL: Select <strong>Auto</strong></li>
                  <li>• Click <strong>Save</strong></li>
                </ul>
              </li>
              <li className="pl-2">
                <span className="font-medium">Wait for DNS propagation</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Changes typically take 1-5 minutes with Cloudflare, but can take up to 24 hours
                </p>
              </li>
            </ol>
          ),
          notes: [
            'Make sure the proxy status is set to "DNS only" (gray cloud) for the CNAME record',
            'Cloudflare typically propagates DNS changes within minutes',
          ],
        }

      case 'godaddy':
        return {
          title: 'GoDaddy',
          docsUrl: 'https://www.godaddy.com/help/add-a-cname-record-19236',
          steps: (
            <ol className="space-y-3 list-decimal list-inside">
              <li className="pl-2">
                <span className="font-medium">Log in to your GoDaddy account</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Visit{' '}
                  <a
                    href="https://dcc.godaddy.com/domains"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    dcc.godaddy.com/domains
                  </a>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Access DNS Management</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Find <code className="bg-gray-100 px-1 rounded">{domain}</code> and click <strong>DNS</strong>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the CNAME record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Scroll to <strong>Records</strong> section</li>
                  <li>• Click <strong>Add New Record</strong></li>
                  <li>• Type: Select <strong>CNAME</strong></li>
                  <li>
                    • Name: Enter <code className="bg-gray-100 px-1 rounded">www</code> or subdomain
                  </li>
                  <li>
                    • Value: Enter <code className="bg-gray-100 px-1 rounded">{cnameValue}</code>
                  </li>
                  <li>• TTL: Leave as <strong>1 Hour</strong> (default)</li>
                  <li>• Click <strong>Save</strong></li>
                </ul>
                <Alert className="mt-2 ml-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Note: GoDaddy doesn't allow CNAME on root (@). Use www or a subdomain, or contact
                    support for apex domain setup.
                  </AlertDescription>
                </Alert>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the TXT record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Click <strong>Add New Record</strong> again</li>
                  <li>• Type: Select <strong>TXT</strong></li>
                  <li>
                    • Name: Enter{' '}
                    <code className="bg-gray-100 px-1 rounded">{txtName.replace(`.${domain}`, '')}</code>
                  </li>
                  <li>
                    • Value: Paste{' '}
                    <code className="bg-gray-100 px-1 rounded text-xs break-all">{txtValue}</code>
                  </li>
                  <li>• TTL: Leave as <strong>1 Hour</strong></li>
                  <li>• Click <strong>Save</strong></li>
                </ul>
              </li>
              <li className="pl-2">
                <span className="font-medium">Wait for DNS propagation</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  GoDaddy updates can take 10-60 minutes, maximum 48 hours
                </p>
              </li>
            </ol>
          ),
        }

      case 'namecheap':
        return {
          title: 'Namecheap',
          docsUrl:
            'https://www.namecheap.com/support/knowledgebase/article.aspx/9646/2237/how-to-create-a-cname-record-for-your-domain/',
          steps: (
            <ol className="space-y-3 list-decimal list-inside">
              <li className="pl-2">
                <span className="font-medium">Log in to Namecheap</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Visit{' '}
                  <a
                    href="https://ap.www.namecheap.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    ap.www.namecheap.com
                  </a>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Access Domain List</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Click <strong>Domain List</strong> in the left sidebar
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Manage DNS</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Find <code className="bg-gray-100 px-1 rounded">{domain}</code> and click{' '}
                  <strong>Manage</strong>, then go to <strong>Advanced DNS</strong> tab
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the CNAME record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Click <strong>Add New Record</strong></li>
                  <li>• Type: Select <strong>CNAME Record</strong></li>
                  <li>
                    • Host: Enter <code className="bg-gray-100 px-1 rounded">www</code>
                  </li>
                  <li>
                    • Value: Enter <code className="bg-gray-100 px-1 rounded">{cnameValue}</code>
                  </li>
                  <li>• TTL: Select <strong>Automatic</strong></li>
                  <li>• Click the green checkmark to save</li>
                </ul>
                <Alert className="mt-2 ml-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    For root domain (@), you'll need to use URL Redirect or A record. Contact support for
                    apex domain setup.
                  </AlertDescription>
                </Alert>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the TXT record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Click <strong>Add New Record</strong></li>
                  <li>• Type: Select <strong>TXT Record</strong></li>
                  <li>
                    • Host: Enter{' '}
                    <code className="bg-gray-100 px-1 rounded">{txtName.replace(`.${domain}`, '')}</code>
                  </li>
                  <li>
                    • Value: Paste{' '}
                    <code className="bg-gray-100 px-1 rounded text-xs break-all">{txtValue}</code>
                  </li>
                  <li>• TTL: Select <strong>Automatic</strong></li>
                  <li>• Click the green checkmark to save</li>
                </ul>
              </li>
              <li className="pl-2">
                <span className="font-medium">Wait for DNS propagation</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Namecheap updates typically take 30 minutes to 48 hours
                </p>
              </li>
            </ol>
          ),
        }

      case 'route53':
        return {
          title: 'AWS Route 53',
          docsUrl:
            'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html',
          steps: (
            <ol className="space-y-3 list-decimal list-inside">
              <li className="pl-2">
                <span className="font-medium">Log in to AWS Console</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Visit{' '}
                  <a
                    href="https://console.aws.amazon.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    console.aws.amazon.com
                  </a>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Navigate to Route 53</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Search for "Route 53" in the services search bar
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Select Hosted Zone</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Click <strong>Hosted zones</strong>, then select{' '}
                  <code className="bg-gray-100 px-1 rounded">{domain}</code>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the CNAME record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Click <strong>Create record</strong></li>
                  <li>• Record type: Select <strong>CNAME</strong></li>
                  <li>• Record name: Enter subdomain (or leave blank for www)</li>
                  <li>
                    • Value: Enter <code className="bg-gray-100 px-1 rounded">{cnameValue}</code>
                  </li>
                  <li>• TTL: 300 seconds (or default)</li>
                  <li>• Routing policy: <strong>Simple routing</strong></li>
                  <li>• Click <strong>Create records</strong></li>
                </ul>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the TXT record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Click <strong>Create record</strong> again</li>
                  <li>• Record type: Select <strong>TXT</strong></li>
                  <li>
                    • Record name: Enter{' '}
                    <code className="bg-gray-100 px-1 rounded">{txtName.replace(`.${domain}`, '')}</code>
                  </li>
                  <li>
                    • Value: Paste{' '}
                    <code className="bg-gray-100 px-1 rounded text-xs break-all">{txtValue}</code>
                  </li>
                  <li>• TTL: 300 seconds</li>
                  <li>• Click <strong>Create records</strong></li>
                </ul>
              </li>
              <li className="pl-2">
                <span className="font-medium">Wait for DNS propagation</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Route 53 changes propagate globally within 60 seconds
                </p>
              </li>
            </ol>
          ),
          notes: ['Route 53 has the fastest DNS propagation of major providers'],
        }

      case 'google':
        return {
          title: 'Google Domains',
          docsUrl: 'https://support.google.com/domains/answer/3290350',
          steps: (
            <ol className="space-y-3 list-decimal list-inside">
              <li className="pl-2">
                <span className="font-medium">Log in to Google Domains</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Visit{' '}
                  <a
                    href="https://domains.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    domains.google.com
                  </a>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Select your domain</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Click on <code className="bg-gray-100 px-1 rounded">{domain}</code>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Navigate to DNS</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Select <strong>DNS</strong> from the left menu
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the CNAME record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Scroll to <strong>Custom resource records</strong></li>
                  <li>• Name: Enter subdomain (or @ for root)</li>
                  <li>• Type: Select <strong>CNAME</strong></li>
                  <li>• TTL: 1H (default)</li>
                  <li>
                    • Data: Enter <code className="bg-gray-100 px-1 rounded">{cnameValue}</code>
                  </li>
                  <li>• Click <strong>Add</strong></li>
                </ul>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the TXT record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Add another custom resource record</li>
                  <li>
                    • Name: Enter{' '}
                    <code className="bg-gray-100 px-1 rounded">{txtName.replace(`.${domain}`, '')}</code>
                  </li>
                  <li>• Type: Select <strong>TXT</strong></li>
                  <li>• TTL: 1H</li>
                  <li>
                    • Data: Paste{' '}
                    <code className="bg-gray-100 px-1 rounded text-xs break-all">{txtValue}</code>
                  </li>
                  <li>• Click <strong>Add</strong></li>
                </ul>
              </li>
              <li className="pl-2">
                <span className="font-medium">Wait for DNS propagation</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Google Domains updates typically take 10-30 minutes
                </p>
              </li>
            </ol>
          ),
        }

      case 'digitalocean':
        return {
          title: 'DigitalOcean',
          docsUrl: 'https://docs.digitalocean.com/products/networking/dns/how-to/manage-records/',
          steps: (
            <ol className="space-y-3 list-decimal list-inside">
              <li className="pl-2">
                <span className="font-medium">Log in to DigitalOcean</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Visit{' '}
                  <a
                    href="https://cloud.digitalocean.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    cloud.digitalocean.com
                  </a>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Navigate to Networking</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Click <strong>Networking</strong> in the left sidebar, then <strong>Domains</strong>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Select your domain</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Click on <code className="bg-gray-100 px-1 rounded">{domain}</code>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the CNAME record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• In the <strong>Add a record</strong> section, select <strong>CNAME</strong></li>
                  <li>• Hostname: Enter subdomain (or @ for root)</li>
                  <li>
                    • Will direct to: Enter <code className="bg-gray-100 px-1 rounded">{cnameValue}</code>
                  </li>
                  <li>• TTL: 3600 (default)</li>
                  <li>• Click <strong>Create Record</strong></li>
                </ul>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the TXT record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Select <strong>TXT</strong> record type</li>
                  <li>
                    • Hostname: Enter{' '}
                    <code className="bg-gray-100 px-1 rounded">{txtName.replace(`.${domain}`, '')}</code>
                  </li>
                  <li>
                    • Value: Paste{' '}
                    <code className="bg-gray-100 px-1 rounded text-xs break-all">{txtValue}</code>
                  </li>
                  <li>• TTL: 3600</li>
                  <li>• Click <strong>Create Record</strong></li>
                </ul>
              </li>
              <li className="pl-2">
                <span className="font-medium">Wait for DNS propagation</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  DigitalOcean DNS changes propagate within minutes
                </p>
              </li>
            </ol>
          ),
        }

      case 'squarespace':
        return {
          title: 'Squarespace',
          docsUrl: 'https://support.squarespace.com/hc/en-us/articles/360002101888',
          steps: (
            <ol className="space-y-3 list-decimal list-inside">
              <li className="pl-2">
                <span className="font-medium">Log in to Squarespace</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Visit{' '}
                  <a
                    href="https://account.squarespace.com/domains"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    account.squarespace.com/domains
                  </a>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Select your domain</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Click on <code className="bg-gray-100 px-1 rounded">{domain}</code>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Open DNS Settings</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Click <strong>DNS Settings</strong> or <strong>Advanced Settings</strong>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the CNAME record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Scroll to <strong>Custom Records</strong></li>
                  <li>• Click <strong>Add Record</strong></li>
                  <li>• Type: Select <strong>CNAME</strong></li>
                  <li>
                    • Host: Enter <code className="bg-gray-100 px-1 rounded">www</code>
                  </li>
                  <li>
                    • Data: Enter <code className="bg-gray-100 px-1 rounded">{cnameValue}</code>
                  </li>
                  <li>• Click <strong>Add</strong></li>
                </ul>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the TXT record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Click <strong>Add Record</strong> again</li>
                  <li>• Type: Select <strong>TXT</strong></li>
                  <li>
                    • Host: Enter{' '}
                    <code className="bg-gray-100 px-1 rounded">{txtName.replace(`.${domain}`, '')}</code>
                  </li>
                  <li>
                    • Data: Paste{' '}
                    <code className="bg-gray-100 px-1 rounded text-xs break-all">{txtValue}</code>
                  </li>
                  <li>• Click <strong>Add</strong></li>
                </ul>
              </li>
              <li className="pl-2">
                <span className="font-medium">Save Changes</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Click <strong>Save</strong> at the bottom of the page
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Wait for DNS propagation</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Squarespace updates usually take 1-2 hours, up to 72 hours maximum
                </p>
              </li>
            </ol>
          ),
          notes: ['Squarespace CNAME only works with subdomains'],
        }

      case 'wix':
        return {
          title: 'Wix',
          docsUrl: 'https://support.wix.com/en/article/connecting-a-domain-to-wix-using-the-pointing-method',
          steps: (
            <ol className="space-y-3 list-decimal list-inside">
              <li className="pl-2">
                <span className="font-medium">Log in to Wix</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Visit{' '}
                  <a
                    href="https://www.wix.com/my-account/domains/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    wix.com/my-account/domains/
                  </a>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Select your domain</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Find <code className="bg-gray-100 px-1 rounded">{domain}</code> and click{' '}
                  <strong>Manage</strong>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Navigate to DNS Records</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Click on <strong>DNS Records</strong> or <strong>Advanced</strong>
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the CNAME record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Click <strong>+ Add Record</strong></li>
                  <li>• Type: Select <strong>CNAME</strong></li>
                  <li>
                    • Host Name: Enter <code className="bg-gray-100 px-1 rounded">www</code>
                  </li>
                  <li>
                    • Value: Enter <code className="bg-gray-100 px-1 rounded">{cnameValue}</code>
                  </li>
                  <li>• TTL: 3600 (or default)</li>
                  <li>• Click <strong>Save</strong></li>
                </ul>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the TXT record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Click <strong>+ Add Record</strong> again</li>
                  <li>• Type: Select <strong>TXT</strong></li>
                  <li>
                    • Host Name: Enter{' '}
                    <code className="bg-gray-100 px-1 rounded">{txtName.replace(`.${domain}`, '')}</code>
                  </li>
                  <li>
                    • Value: Paste{' '}
                    <code className="bg-gray-100 px-1 rounded text-xs break-all">{txtValue}</code>
                  </li>
                  <li>• TTL: 3600</li>
                  <li>• Click <strong>Save</strong></li>
                </ul>
              </li>
              <li className="pl-2">
                <span className="font-medium">Wait for DNS propagation</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Wix DNS changes can take up to 48 hours to propagate
                </p>
              </li>
            </ol>
          ),
        }

      case 'other':
      default:
        return {
          title: 'Generic DNS Provider',
          docsUrl: '',
          steps: (
            <ol className="space-y-3 list-decimal list-inside">
              <li className="pl-2">
                <span className="font-medium">Log in to your DNS provider</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Access your domain registrar or DNS hosting provider's control panel
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Find DNS Management</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Look for sections labeled: DNS Management, DNS Records, Zone Editor, or Advanced DNS
                </p>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the CNAME record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Find option to add a new DNS record</li>
                  <li>• Type/Record Type: Select <strong>CNAME</strong></li>
                  <li>• Name/Host/Subdomain: Enter subdomain or @ for root</li>
                  <li>
                    • Value/Points To/Target: Enter{' '}
                    <code className="bg-gray-100 px-1 rounded">{cnameValue}</code>
                  </li>
                  <li>• TTL: Use default or 3600 seconds</li>
                  <li>• Save the record</li>
                </ul>
              </li>
              <li className="pl-2">
                <span className="font-medium">Add the TXT record</span>
                <ul className="text-sm text-gray-600 mt-2 ml-6 space-y-1">
                  <li>• Add another new DNS record</li>
                  <li>• Type/Record Type: Select <strong>TXT</strong></li>
                  <li>
                    • Name/Host: Enter{' '}
                    <code className="bg-gray-100 px-1 rounded">{txtName.replace(`.${domain}`, '')}</code>
                  </li>
                  <li>
                    • Value/Text: Paste{' '}
                    <code className="bg-gray-100 px-1 rounded text-xs break-all">{txtValue}</code>
                  </li>
                  <li>• TTL: Use default or 3600 seconds</li>
                  <li>• Save the record</li>
                </ul>
              </li>
              <li className="pl-2">
                <span className="font-medium">Wait for DNS propagation</span>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  DNS changes typically take 30 minutes to 48 hours to fully propagate globally
                </p>
              </li>
            </ol>
          ),
          notes: [
            'Different providers use different terminology',
            'If you have trouble finding DNS settings, contact your provider support',
            'Some providers may require removing existing records first',
          ],
        }
    }
  }

  const instructions = getInstructions()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {instructions.title} Setup Instructions
        </CardTitle>
        <CardDescription>
          Step-by-step guide to configure your DNS records at {instructions.title}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {instructions.steps}

        {instructions.notes && instructions.notes.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Important Notes:</p>
              <ul className="space-y-1 text-sm">
                {instructions.notes.map((note, idx) => (
                  <li key={idx}>• {note}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {instructions.docsUrl && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" asChild>
              <a href={instructions.docsUrl} target="_blank" rel="noopener noreferrer">
                View Official Documentation
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
