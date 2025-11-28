export type LinkType = 'internal_page' | 'blog_index' | 'external'

export interface Menu {
  id: string
  site_id: string
  name: string
  created_at: string
  updated_at: string
  items?: MenuItem[]
}

export interface MenuItem {
  id: string
  menu_id: string
  label: string
  link_type: LinkType
  target_content_id?: string | null
  url?: string | null
  is_primary_button: boolean
  position: number
  created_at: string
  updated_at: string
}

export interface CreateMenuItemInput {
  menu_id: string
  label: string
  link_type: LinkType
  target_content_id?: string | null
  url?: string | null
  is_primary_button?: boolean
  position: number
}

export interface UpdateMenuItemInput {
  label?: string
  link_type?: LinkType
  target_content_id?: string | null
  url?: string | null
  is_primary_button?: boolean
  position?: number
}
