'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export interface DNSRecord {
  type: 'CNAME' | 'TXT'
  name: string
  value: string
  ttl: number
  description?: string
}

interface DNSRecordDisplayProps {
  records: DNSRecord[]
  compact?: boolean
}

export function DNSRecordDisplay({ records, compact = false }: DNSRecordDisplayProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(label)
      toast.success(`${label} copied to clipboard`)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {records.map((record, idx) => (
          <div key={idx} className="p-3 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="font-mono text-xs">
                {record.type}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(record.value, `${record.type} value`)}
                className="h-7"
              >
                {copiedField === `${record.type} value` ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Name:</span>
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{record.name}</code>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Value:</span>
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs truncate max-w-[200px]">
                  {record.value}
                </code>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {records.map((record, idx) => (
        <Card key={idx}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{record.type} Record</Badge>
                {record.description && (
                  <span className="text-sm text-muted-foreground">{record.description}</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(record.value, `${record.type} value`)}
              >
                {copiedField === `${record.type} value` ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Value
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Type</p>
                <p className="font-mono text-sm">{record.type}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Name / Host</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm break-all">{record.name}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => handleCopy(record.name, `${record.type} name`)}
                  >
                    {copiedField === `${record.type} name` ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">TTL</p>
                <p className="font-mono text-sm">{record.ttl || 'Auto'}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-muted-foreground">Value / Points To</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopy(record.value, `${record.type} value`)}
                >
                  {copiedField === `${record.type} value` ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="relative">
                <p className="font-mono text-xs break-all bg-muted p-3 rounded border">
                  {record.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
