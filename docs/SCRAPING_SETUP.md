# Website Scraping Configuration

The LLM site generator supports generating sites based on existing websites. When a user provides a website URL, the system will scrape and analyze the existing site to create an enhanced, modernized version.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Getting the Salt Value](#getting-the-salt-value)
- [Testing the Configuration](#testing-the-configuration)
- [Usage Examples](#usage-examples)
- [How It Works](#how-it-works)
- [Troubleshooting](#troubleshooting)

## Environment Variables

Add the following to your `.env.local` file for local development:

```bash
# Scraping Service Configuration
SCRAPING_SERVICE_URL=https://puppeteer-api-production-7bea.up.railway.app
SCRAPING_SERVICE_SALT=your-secret-salt-here
SCRAPING_SERVICE_TIMEOUT=30000
SCRAPING_SERVICE_MAX_RETRIES=2
```

### Variable Descriptions

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SCRAPING_SERVICE_URL` | URL of the Puppeteer scraping service | - | Yes |
| `SCRAPING_SERVICE_SALT` | Secret salt for MD5 authentication | - | Yes |
| `SCRAPING_SERVICE_TIMEOUT` | Timeout in milliseconds for scraping requests | 30000 | No |
| `SCRAPING_SERVICE_MAX_RETRIES` | Number of retry attempts for failed requests | 2 | No |

## Getting the Salt Value

The salt is used for MD5 authentication with the scraping service. It ensures only authorized clients can access the service.

### For Development

1. Contact the infrastructure team or development lead
2. Check the shared secrets vault (1Password, AWS Secrets Manager, etc.)
3. Never commit the salt value to version control

### For Production

The salt should be configured as an environment variable in your deployment platform (Railway, Vercel, etc.). See [SCRAPING_DEPLOYMENT.md](./SCRAPING_DEPLOYMENT.md) for production setup instructions.

## Testing the Configuration

### Method 1: Using curl

Test your scraping service connection using curl:

```bash
# Calculate MD5 hash
URL="https://example.com"
SALT="your-secret-salt-here"
HASH=$(echo -n "${URL}:${SALT}" | md5sum | awk '{print $1}')

# Make request
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${URL}\", \"hash\": \"${HASH}\"}" \
  https://puppeteer-api-production-7bea.up.railway.app/fetch
```

### Method 2: Using the API

Create a test site generation request through the API:

```bash
curl -X POST http://localhost:3001/api/sites/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "businessInfo": {
      "prompt": "Test scraping functionality",
      "name": "Test Business",
      "basedOnWebsite": "https://example.com"
    }
  }'
```

### Expected Response

A successful scraping request should return:

```json
{
  "success": true,
  "html": "<!DOCTYPE html>...",
  "url": "https://example.com",
  "statusCode": 200
}
```

## Usage Examples

### Basic Usage

Users can provide an optional `basedOnWebsite` URL when generating a site:

```json
{
  "businessInfo": {
    "prompt": "Create a modern website for my business",
    "name": "Green Thumb Gardens",
    "basedOnWebsite": "https://oldgardensite.com"
  }
}
```

### With Additional Context

Combine website scraping with detailed business information:

```json
{
  "businessInfo": {
    "prompt": "Modernize my garden center website with e-commerce capabilities",
    "name": "Green Thumb Gardens",
    "basedOnWebsite": "https://oldgardensite.com",
    "description": "Family-owned garden center specializing in native plants",
    "industry": "Retail - Garden & Nursery"
  }
}
```

### Without Website (Traditional Approach)

If no `basedOnWebsite` is provided, the system generates based purely on the prompt:

```json
{
  "businessInfo": {
    "prompt": "Create a website for a modern garden center",
    "name": "Green Thumb Gardens",
    "description": "Family-owned garden center",
    "industry": "Retail - Garden & Nursery"
  }
}
```

## How It Works

When a user provides a `basedOnWebsite` URL, the system follows this workflow:

### 1. URL Validation & Security

- Validates the URL format and protocol (http/https only)
- Checks against SSRF attack patterns
- Applies rate limiting to prevent abuse

### 2. Page Discovery

- Scrapes the homepage
- Extracts navigation links
- Identifies up to 4 additional important pages (About, Contact, Services, etc.)
- Maximum of 5 pages total per site

### 3. Content Extraction

For each page, the system extracts:

- **Business Information**: Contact details, hours of operation, location
- **Brand Identity**: Colors, logo information, tone of voice
- **Content Structure**: Headings, sections, key messaging
- **Features & Services**: Product listings, service descriptions

### 4. Content Analysis

The extracted data is analyzed and synthesized into:

- Primary brand colors and visual identity
- Business contact information (phone, email, address)
- Operating hours and location details
- Key services and offerings
- Messaging tone and style

### 5. LLM Enhancement

The scraped context is provided to the LLM along with the user's prompt:

```
You are generating a website based on an existing site.

Scraped Website Context:
- Business Name: Green Thumb Gardens
- Contact: (555) 123-4567
- Colors: #2d5016 (primary), #8bc34a (accent)
- Services: Native plants, landscaping design, garden supplies
...

User's Request: "Modernize my garden center website"

Generate an improved version that...
```

### 6. Site Generation

The LLM generates:

- Enhanced homepage with modernized design
- Custom pages based on discovered content
- Dynamic navigation matching the site structure
- Improved content while preserving business details

### 7. Graceful Fallback

If scraping fails for any reason:

- System logs the error for monitoring
- Falls back to prompt-only generation
- User still receives a generated site
- No disruption to the user experience

## Troubleshooting

### Error: "Missing required scraping service configuration"

**Cause**: `SCRAPING_SERVICE_URL` or `SCRAPING_SERVICE_SALT` not set

**Solution**:
```bash
# Check your .env.local file
cat .env.local | grep SCRAPING_SERVICE

# Add missing variables
echo "SCRAPING_SERVICE_URL=https://puppeteer-api-production-7bea.up.railway.app" >> .env.local
echo "SCRAPING_SERVICE_SALT=your-secret-salt" >> .env.local
```

### Error: "Invalid hash"

**Cause**: Incorrect salt value or hash calculation

**Solution**:
1. Verify salt value is correct
2. Ensure hash is calculated as: `md5(url:salt)` (lowercase)
3. Check for extra whitespace in salt value

### Scraping Timeout

**Cause**: Website takes too long to load or scraping service is slow

**Solution**:
```bash
# Increase timeout in .env.local
SCRAPING_SERVICE_TIMEOUT=60000
```

### Rate Limit Exceeded

**Cause**: Too many scraping requests in short time

**Solution**:
- Wait before retrying
- Check rate limit configuration in `src/lib/security/site-generation-rate-limit.ts`
- For development, you may need to adjust limits

### SSRF Warning

**Cause**: URL points to internal/private network

**Solution**:
- Only use public websites for scraping
- Avoid localhost, 127.0.0.1, 192.168.x.x, 10.x.x.x addresses
- The system blocks these automatically for security

## Security Considerations

### SSRF Protection

The system includes Server-Side Request Forgery (SSRF) protection:

- Blocks private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- Blocks localhost and loopback addresses
- Validates URL format and protocol
- Only allows http:// and https:// protocols

### Content Moderation

Scraped content is moderated for:

- Malicious HTML/JavaScript
- Inappropriate content
- Spam or excessive promotional material

### Rate Limiting

To prevent abuse:

- Limited to 5 pages per website
- Rate limits on scraping requests
- Timeout protection for long-running scrapes

## Next Steps

- For production deployment, see [SCRAPING_DEPLOYMENT.md](./SCRAPING_DEPLOYMENT.md)
- For implementation details, see [SCRAPING_IMPLEMENTATION.md](./SCRAPING_IMPLEMENTATION.md)
- For general platform documentation, see [platform-overview.md](./platform-overview.md)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review error logs in your application
3. Contact the development team
4. See the main [README.md](../README.md) for general support
