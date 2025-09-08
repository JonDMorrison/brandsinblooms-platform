'use client'

import { Layout, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { Card, CardContent } from '@/src/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Switch } from '@/src/components/ui/switch'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/src/components/ui/collapsible'
import { cn } from '@/src/lib/utils'
import { toast } from 'sonner'
import { HeaderCustomizationProps } from './types'
import { HEADER_STYLES } from './constants'

interface HeaderStyleSectionProps extends Pick<HeaderCustomizationProps, 'value' | 'onChange'> {}

export function HeaderStyleSection({ value, onChange }: HeaderStyleSectionProps) {
  const [headerStyleOpen, setHeaderStyleOpen] = useState(true)

  const handleLayoutChange = (key: string, val: any) => {
    onChange({
      ...value,
      layout: {
        ...value.layout,
        [key]: val
      }
    })
    
    if (key === 'headerStyle') {
      const styleName = HEADER_STYLES.find(s => s.value === val)?.label || val
      toast.success(`Header style changed to ${styleName}`)
    } else if (key === 'stickyHeader') {
      toast.success(`Header ${val ? 'fixed to top' : 'no longer fixed'}`)
    }
  }

  return (
    <Collapsible open={headerStyleOpen} onOpenChange={setHeaderStyleOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto hover:bg-transparent"
        >
          <Label className="text-base font-semibold cursor-pointer flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Header Style
          </Label>
          {headerStyleOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <RadioGroup
          value={value.layout?.headerStyle || 'modern'}
          onValueChange={(val) => handleLayoutChange('headerStyle', val)}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {HEADER_STYLES.map((style) => (
              <Card 
                key={style.value}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95",
                  value.layout?.headerStyle === style.value ? "ring-2 ring-primary ring-offset-2" : ""
                )}
                onClick={() => handleLayoutChange('headerStyle', style.value)}
              >
                <CardContent className="p-4">
                  <RadioGroupItem value={style.value} className="sr-only" />
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">{style.label}</span>
                      <p className="text-sm text-muted-foreground">{style.description}</p>
                    </div>
                    
                    {/* Visual Preview */}
                    <div className="h-12 rounded border bg-gray-50 p-2 flex items-center justify-between">
                      {style.value === 'modern' && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-2 bg-primary rounded-sm"></div>
                            <div className="flex gap-0.5">
                              <div className="w-1.5 h-0.5 bg-gray-300 rounded"></div>
                              <div className="w-1.5 h-0.5 bg-gray-300 rounded"></div>
                              <div className="w-1.5 h-0.5 bg-gray-300 rounded"></div>
                            </div>
                          </div>
                          <div className="w-3 h-1.5 bg-primary rounded-sm"></div>
                        </>
                      )}
                      {style.value === 'classic' && (
                        <>
                          <div className="flex flex-col items-center gap-1 flex-1">
                            <div className="w-6 h-1.5 bg-primary rounded-sm"></div>
                            <div className="flex gap-0.5">
                              <div className="w-1.5 h-0.5 bg-gray-300 rounded"></div>
                              <div className="w-1.5 h-0.5 bg-gray-300 rounded"></div>
                              <div className="w-1.5 h-0.5 bg-gray-300 rounded"></div>
                              <div className="w-1.5 h-0.5 bg-gray-300 rounded"></div>
                            </div>
                          </div>
                        </>
                      )}
                      {style.value === 'minimal' && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-2 bg-primary rounded-sm"></div>
                          </div>
                          <div className="w-3 h-3 border border-gray-300 rounded flex items-center justify-center">
                            <div className="w-1.5 h-0.5 bg-gray-400"></div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </RadioGroup>

        {/* Sticky Header Toggle */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sticky-header" className="text-sm font-medium">
                Fixed to Top
              </Label>
              <div className="text-xs text-muted-foreground">
                Header stays fixed at the top when scrolling
              </div>
            </div>
            <Switch
              id="sticky-header"
              checked={value.layout?.stickyHeader !== false}
              onCheckedChange={(checked) => handleLayoutChange('stickyHeader', checked)}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}