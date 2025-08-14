import { promises as fs } from 'fs'

interface HealthResponse {
  status: 'ok' | 'degraded'
  timestamp: string
  service: string
  environment: string
  version: string
  uptime: number
  migrations: {
    status: 'completed' | 'failed' | 'running' | 'unknown'
    lastChecked: string
    details?: string
  }
}

/**
 * Check migration status from filesystem markers
 */
async function checkMigrationStatus(): Promise<{
  status: 'completed' | 'failed' | 'running' | 'unknown'
  details?: string
}> {
  try {
    // Check for completion marker
    if (await fs.access('/tmp/migrations/completed').then(() => true).catch(() => false)) {
      return { status: 'completed' }
    }
    
    // Check for failure marker
    if (await fs.access('/tmp/migrations/failed').then(() => true).catch(() => false)) {
      try {
        const details = await fs.readFile('/tmp/migrations/failed.log', 'utf-8')
        return { status: 'failed', details: details.trim() }
      } catch {
        return { status: 'failed', details: 'Migration failed (no details available)' }
      }
    }
    
    // Check for running marker
    if (await fs.access('/tmp/migrations/running').then(() => true).catch(() => false)) {
      return { status: 'running' }
    }
    
    // Check if migration process is still active
    try {
      const pidFile = await fs.readFile('/tmp/migrations/pid', 'utf-8')
      const pid = parseInt(pidFile.trim(), 10)
      
      if (!isNaN(pid)) {
        // Check if process is still running (works in Node.js)
        try {
          process.kill(pid, 0) // Signal 0 just checks if process exists
          return { status: 'running', details: `Migration process ${pid} is active` }
        } catch {
          // Process doesn't exist anymore
          return { status: 'unknown', details: 'Migration process completed but status unclear' }
        }
      }
    } catch {
      // PID file doesn't exist or is invalid
    }
    
    return { status: 'unknown' }
  } catch (error) {
    return { 
      status: 'unknown', 
      details: `Error checking migration status: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

export const GET = async () => {
  try {
    const migrationStatus = await checkMigrationStatus()
    const timestamp = new Date().toISOString()
    
    // Determine overall health status
    const overallStatus = migrationStatus.status === 'failed' ? 'degraded' : 'ok'
    
    const response: HealthResponse = {
      status: overallStatus,
      timestamp,
      service: 'brands-in-blooms',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      migrations: {
        status: migrationStatus.status,
        lastChecked: timestamp,
        ...(migrationStatus.details && { details: migrationStatus.details })
      }
    }
    
    // Return appropriate HTTP status code
    const httpStatus = overallStatus === 'degraded' ? 503 : 200
    
    return Response.json(response, { status: httpStatus })
    
  } catch {
    return Response.json(
      { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        service: 'brands-in-blooms',
        error: 'Health check failed',
        migrations: {
          status: 'unknown',
          lastChecked: new Date().toISOString(),
          details: 'Could not check migration status'
        }
      },
      { status: 500 }
    )
  }
}