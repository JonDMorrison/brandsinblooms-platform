import { Moon, Sun } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { useTheme } from '@/src/hooks/useTheme'

export function ThemeToggle() {
  const { toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all  " />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all  " />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}