'use client'

import { useState } from 'react'
import { format, addDays, addWeeks, addMonths, addYears, isBefore, isAfter } from 'date-fns'
import { CalendarIcon, Repeat } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Input } from '@/src/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Calendar } from '@/src/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { cn } from '@/lib/utils'

type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'yearly'
type EndType = 'date' | 'count'

interface RepeatEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate: (occurrences: GeneratedOccurrence[]) => void
  baseOccurrence: {
    start_datetime: string
    end_datetime: string | null
    is_all_day: boolean
    location: string | null
  }
}

export interface GeneratedOccurrence {
  start_datetime: string
  end_datetime: string | null
  is_all_day: boolean
  location: string | null
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

const MAX_MONTHS = 6

export function RepeatEventModal({
  open,
  onOpenChange,
  onGenerate,
  baseOccurrence,
}: RepeatEventModalProps) {
  const [frequency, setFrequency] = useState<FrequencyType>('weekly')
  const [interval, setInterval] = useState(1)
  const [endType, setEndType] = useState<EndType>('count')
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [occurrenceCount, setOccurrenceCount] = useState(10)
  const [selectedDays, setSelectedDays] = useState<number[]>([new Date(baseOccurrence.start_datetime).getDay()])
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    )
  }

  const calculateOccurrences = (): GeneratedOccurrence[] => {
    const occurrences: GeneratedOccurrence[] = []
    const baseStart = new Date(baseOccurrence.start_datetime)
    const baseEnd = baseOccurrence.end_datetime ? new Date(baseOccurrence.end_datetime) : null
    const duration = baseEnd ? baseEnd.getTime() - baseStart.getTime() : 0

    // Calculate the maximum date (6 months from base)
    const maxDate = addMonths(baseStart, MAX_MONTHS)

    let currentDate = new Date(baseStart)
    let count = 0

    // Determine end condition
    const shouldContinue = () => {
      if (isAfter(currentDate, maxDate)) return false
      if (endType === 'count') return count < occurrenceCount
      if (endType === 'date' && endDate) return isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()
      return false
    }

    while (shouldContinue() && count < 365) { // Safety limit
      let shouldAdd = true

      if (frequency === 'weekly' && selectedDays.length > 0) {
        // For weekly, check if current day is in selected days
        shouldAdd = selectedDays.includes(currentDate.getDay())
      }

      if (shouldAdd) {
        const newStart = new Date(currentDate)
        const newEnd = baseEnd ? new Date(newStart.getTime() + duration) : null

        occurrences.push({
          start_datetime: newStart.toISOString(),
          end_datetime: newEnd ? newEnd.toISOString() : null,
          is_all_day: baseOccurrence.is_all_day,
          location: baseOccurrence.location,
        })

        count++
      }

      // Move to next occurrence
      switch (frequency) {
        case 'daily':
          currentDate = addDays(currentDate, interval)
          break
        case 'weekly':
          if (frequency === 'weekly' && selectedDays.length > 0) {
            // Move to next selected day
            let nextDay = currentDate.getDay()
            let daysToAdd = 1

            // Find next selected day
            for (let i = 1; i <= 7; i++) {
              nextDay = (currentDate.getDay() + i) % 7
              if (selectedDays.includes(nextDay)) {
                daysToAdd = i
                break
              }
            }

            currentDate = addDays(currentDate, daysToAdd)

            // If we've cycled through all selected days, add interval weeks
            if (nextDay <= currentDate.getDay() && interval > 1) {
              currentDate = addWeeks(currentDate, interval - 1)
            }
          } else {
            currentDate = addWeeks(currentDate, interval)
          }
          break
        case 'monthly':
          currentDate = addMonths(currentDate, interval)
          break
        case 'yearly':
          currentDate = addYears(currentDate, interval)
          break
      }
    }

    return occurrences
  }

  const handleGenerate = () => {
    const occurrences = calculateOccurrences()

    if (occurrences.length === 0) {
      return
    }

    onGenerate(occurrences)
    onOpenChange(false)

    // Reset form
    setFrequency('weekly')
    setInterval(1)
    setEndType('count')
    setEndDate(undefined)
    setOccurrenceCount(10)
    setSelectedDays([new Date(baseOccurrence.start_datetime).getDay()])
  }

  const previewCount = calculateOccurrences().length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Repeat Event
          </DialogTitle>
          <DialogDescription>
            Create multiple occurrences based on a repeating pattern. Maximum {MAX_MONTHS} months from the base date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Frequency */}
          <div className="space-y-2">
            <Label>Repeat every</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={99}
                value={interval}
                onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20"
              />
              <Select value={frequency} onValueChange={(value) => setFrequency(value as FrequencyType)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Day{interval > 1 ? 's' : ''}</SelectItem>
                  <SelectItem value="weekly">Week{interval > 1 ? 's' : ''}</SelectItem>
                  <SelectItem value="monthly">Month{interval > 1 ? 's' : ''}</SelectItem>
                  <SelectItem value="yearly">Year{interval > 1 ? 's' : ''}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Days of week (only for weekly) */}
          {frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>Repeat on</Label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors',
                      selectedDays.includes(day.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* End condition */}
          <div className="space-y-3">
            <Label>Ends</Label>
            <RadioGroup value={endType} onValueChange={(value) => setEndType(value as EndType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="count" id="end-count" />
                <Label htmlFor="end-count" className="font-normal flex items-center gap-2 flex-1">
                  After
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={occurrenceCount}
                    onChange={(e) => {
                      setOccurrenceCount(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))
                      setEndType('count')
                    }}
                    className="w-20"
                  />
                  occurrences
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="date" id="end-date" />
                <Label htmlFor="end-date" className="font-normal flex items-center gap-2 flex-1">
                  On
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'justify-start text-left font-normal flex-1',
                          !endDate && 'text-muted-foreground'
                        )}
                        onClick={() => setEndType('date')}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border shadow-md" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date)
                          setEndType('date')
                          setIsCalendarOpen(false)
                        }}
                        disabled={(date) =>
                          isBefore(date, new Date(baseOccurrence.start_datetime)) ||
                          isAfter(date, addMonths(new Date(baseOccurrence.start_datetime), MAX_MONTHS))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              Will create <span className="font-semibold text-foreground">{previewCount}</span> occurrence{previewCount !== 1 ? 's' : ''}
              {previewCount > 0 && (
                <>
                  {' '}from <span className="font-semibold text-foreground">{format(new Date(baseOccurrence.start_datetime), 'PP')}</span>
                  {' '}to <span className="font-semibold text-foreground">
                    {format(new Date(calculateOccurrences()[previewCount - 1].start_datetime), 'PP')}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={previewCount === 0}>
            Generate {previewCount} Occurrence{previewCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
