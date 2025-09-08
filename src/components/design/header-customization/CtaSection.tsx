'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/src/components/ui/collapsible'
import { HeaderCustomizationProps } from './types'

interface CtaSectionProps extends Pick<HeaderCustomizationProps, 'value' | 'onChange'> {
  localCtaButton: { text: string; href: string }
  setLocalCtaButton: (cta: { text: string; href: string }) => void
  debouncedCtaChange: (field: 'text' | 'href', value: string) => void
}

export function CtaSection({ localCtaButton, setLocalCtaButton, debouncedCtaChange }: CtaSectionProps) {
  const [ctaOpen, setCtaOpen] = useState(true)

  return (
    <Collapsible open={ctaOpen} onOpenChange={setCtaOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto hover:bg-transparent"
        >
          <Label className="text-base font-semibold cursor-pointer">CTA Button</Label>
          {ctaOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-4">
        <Input
          placeholder="Button text (e.g., Shop Now)"
          value={localCtaButton.text}
          onChange={(e) => {
            setLocalCtaButton({ ...localCtaButton, text: e.target.value })
            debouncedCtaChange('text', e.target.value)
          }}
        />
        <Input
          placeholder="Button URL (e.g., /products)"
          value={localCtaButton.href}
          onChange={(e) => {
            setLocalCtaButton({ ...localCtaButton, href: e.target.value })
            debouncedCtaChange('href', e.target.value)
          }}
        />
      </CollapsibleContent>
    </Collapsible>
  )
}