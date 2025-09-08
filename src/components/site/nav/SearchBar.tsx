import { Search, X } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import type { SearchBarProps } from './types'

export function SearchBar({ searchOpen, setSearchOpen }: SearchBarProps) {
  if (searchOpen) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="search"
          placeholder="Search products..."
          className="w-[200px]"
          autoFocus
          onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSearchOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setSearchOpen(true)}
    >
      <Search className="h-5 w-5" />
      <span className="sr-only">Search</span>
    </Button>
  )
}