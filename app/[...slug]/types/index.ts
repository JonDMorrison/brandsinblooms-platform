export interface SitePageProps {
  params: Promise<{ 
    slug?: string[] 
  }>
}

export interface PageSlugData {
  slug: string[]
  path: string
}