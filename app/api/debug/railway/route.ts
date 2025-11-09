import { NextRequest, NextResponse } from 'next/server'
import { getAppDomain } from '@/lib/env/app-domain'

/**
 * Debug endpoint to check Railway configuration and port settings
 * Access at: /api/debug/railway
 */
export async function GET(request: NextRequest) {
  // Only allow in non-production or with secret key
  const isAuthorized = 
    process.env.NODE_ENV !== 'production' || 
    request.headers.get('x-debug-key') === process.env.DEBUG_KEY

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT || 'not set (using default)',
      HOSTNAME: process.env.HOSTNAME || 'not set',
    },
    railway: {
      RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN || 'not set',
      RAILWAY_STATIC_URL: process.env.RAILWAY_STATIC_URL || 'not set',
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'not set',
      RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID || 'not set',
      RAILWAY_SERVICE_ID: process.env.RAILWAY_SERVICE_ID || 'not set',
      RAILWAY_DEPLOYMENT_ID: process.env.RAILWAY_DEPLOYMENT_ID || 'not set',
      RAILWAY_REPLICA_ID: process.env.RAILWAY_REPLICA_ID || 'not set',
      RAILWAY_REGION: process.env.RAILWAY_REGION || 'not set',
    },
    request: {
      url: request.url,
      host: request.headers.get('host'),
      'x-forwarded-host': request.headers.get('x-forwarded-host'),
      'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
      'x-forwarded-port': request.headers.get('x-forwarded-port'),
      'x-real-ip': request.headers.get('x-real-ip'),
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      referer: request.headers.get('referer'),
    },
    nextConfig: {
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || 'not set',
      appDomain: getAppDomain(),
    },
    process: {
      pid: process.pid,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    },
  }

  // Check for port mismatch
  const requestHost = request.headers.get('host')
  const warnings: string[] = []
  
  if (requestHost?.includes(':8080')) {
    warnings.push('WARNING: Request coming through port 8080 - this indicates a proxy/redirect issue')
  }
  
  if (process.env.PORT && process.env.PORT !== '3000' && process.env.PORT !== '8080') {
    warnings.push(`INFO: Non-standard PORT configured: ${process.env.PORT}`)
  }

  if (!process.env.PORT) {
    warnings.push('INFO: PORT environment variable not set - using application default')
  }

  return NextResponse.json({
    ...debugInfo,
    warnings,
    diagnostics: {
      portIssueDetected: requestHost?.includes(':8080'),
      recommendedActions: [
        'Check Railway service settings for port configuration',
        'Verify domain DNS/proxy settings',
        'Ensure Railway is not manually setting PORT to 8080',
        'Check for any load balancer or CDN configuration',
      ],
    },
  }, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  })
}