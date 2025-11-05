import { headers } from 'next/headers'

export async function getSiteHeaders() {
  const headersList = await headers()
  const siteId = headersList.get('x-site-id') || '00000000-0000-0000-0000-000000000001'
  return { siteId, headersList }
}

export function isProductRoute(path: string): boolean {
  return path.startsWith('products/')
}

export function isCategoryRoute(path: string): boolean {
  return path.startsWith('category/')
}

export function extractSlugFromPath(path: string, prefix: string): string {
  return path.replace(`${prefix}/`, '')
}

export function isOrderConfirmationRoute(path: string): boolean {
  return path.startsWith('order-confirmation/')
}

export function extractOrderIdFromPath(path: string): string {
  return path.replace('order-confirmation/', '')
}