import { apiSuccess } from '@/src/lib/types/api'

interface HealthResponse {
  status: 'ok'
  timestamp: string
  service: string
}

export const GET = async () => {
  return apiSuccess<HealthResponse>({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'brands-in-blooms',
  })
}