import { ApiHandler, ApiRequest, ApiResponse, apiSuccess, apiError } from '@/src/lib/types/api'

interface VitalsData {
  id: string
  name: string
  value: number
  label: string
  timestamp: number
  url: string
  userAgent: string
}

interface VitalsResponse {
  success: boolean
}

export const POST: ApiHandler<VitalsData, VitalsResponse> = async (request: ApiRequest<VitalsData>): Promise<ApiResponse<VitalsResponse>> => {
  try {
    const data: VitalsData = await request.json()

    // In production, you would send this to your analytics service
    // Examples: Google Analytics, Mixpanel, Segment, custom database, etc.
    
    // Log to server console for now
    console.log('[Analytics] Web Vitals:', {
      metric: data.name,
      value: data.value,
      url: data.url,
      timestamp: new Date(data.timestamp).toISOString(),
    })

    // Example: Store in database
    // await db.webVitals.create({
    //   data: {
    //     metricId: data.id,
    //     metricName: data.name,
    //     value: data.value,
    //     label: data.label,
    //     url: data.url,
    //     userAgent: data.userAgent,
    //     timestamp: new Date(data.timestamp),
    //   }
    // })

    // Example: Send to external analytics service
    // await fetch('https://analytics.example.com/vitals', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`,
    //   },
    //   body: JSON.stringify(data),
    // })

    return apiSuccess({ success: true })
  } catch (error) {
    console.error('Failed to process web vitals:', error)
    return apiError(
      'Failed to process analytics data',
      'VITALS_PROCESSING_ERROR',
      500
    )
  }
}