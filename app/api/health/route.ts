import { apiSuccess } from '@/src/lib/types/api'

interface HealthResponse {
  status: 'ok'
  timestamp: string
  service: string
  environment: string
  version: string
  uptime: number
}

export const GET = async () => {
  try {
    return apiSuccess<HealthResponse>({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'brands-in-blooms',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
    })
  } catch (error) {
    return Response.json(
      { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        service: 'brands-in-blooms',
        error: 'Health check failed' 
      },
      { status: 500 }
    )
  }
}