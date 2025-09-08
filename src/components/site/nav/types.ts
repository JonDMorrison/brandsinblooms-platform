export interface NavigationItem {
  label: string
  href: string
  icon?: React.ReactNode
  children?: NavigationItem[]
}

export interface SiteNavigationProps {
  className?: string
}

export interface BrandLogoProps {
  brandingType: 'text' | 'logo' | 'both'
  logoUrl?: string | null
  brandText: string
  logoSize: number
  className?: string
  textClassName?: string
}

export interface NavItemProps {
  item: NavigationItem
}

export interface MobileNavItemProps extends NavItemProps {
  onClick: () => void
}

export interface UserMenuProps {
  user: any
  canEdit: boolean
}

export interface SearchBarProps {
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
}

export interface CartButtonProps {
  itemCount: number
}