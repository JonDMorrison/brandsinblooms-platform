'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/src/components/ui/form'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Calendar } from '@/src/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/src/lib/utils'
import { useCreateEvent } from '@/src/hooks/useEvents'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { generateUniqueEventSlug, createEventOccurrence } from '@/src/lib/queries/domains/events'
import { supabase } from '@/src/lib/supabase/client'

const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  event_date: z.date({ message: 'Event date is required' }),
})

type EventFormData = z.infer<typeof eventFormSchema>

interface CreateEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventCreated?: () => void
}

export function CreateEventModal({ open, onOpenChange, onEventCreated }: CreateEventModalProps) {
  const router = useRouter()
  const { currentSite } = useSiteContext()
  const [isCreating, setIsCreating] = useState(false)
  const { mutate: createEvent } = useCreateEvent()

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      event_date: undefined,
    }
  })

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        title: '',
        event_date: undefined,
      })
    }
  }, [open, form])

  const onSubmit = async (data: EventFormData) => {
    if (!currentSite) {
      toast.error('Site not found')
      return
    }

    setIsCreating(true)
    const toastId = toast.loading('Creating event...')

    try {
      // Generate unique slug
      const slug = await generateUniqueEventSlug(supabase, data.title, currentSite.id)

      // Set sensible defaults for omitted fields
      // Default to all-day event since no time is captured
      const startDate = new Date(data.event_date)
      startDate.setHours(0, 0, 0, 0)
      const start_datetime = startDate.toISOString()

      const endDate = new Date(data.event_date)
      endDate.setHours(23, 59, 59, 999)
      const end_datetime = endDate.toISOString()

      // Get user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

      // Create event with defaults
      const newEvent = await createEvent({
        title: data.title,
        subtitle: null,
        slug,
        description: null,
        start_datetime,
        end_datetime,
        is_all_day: true,
        timezone,
        location: null,
        status: 'draft',
        meta_data: {},
      })

      if (!newEvent) {
        throw new Error('Failed to create event')
      }

      // Create initial occurrence with the selected date
      await createEventOccurrence(supabase, {
        event_id: newEvent.id,
        start_datetime: start_datetime,
        end_datetime: end_datetime,
        is_all_day: true,
        location: null,
        meta_data: {}
      })

      toast.dismiss(toastId)
      onOpenChange(false)
      onEventCreated?.()

      // Navigate to editor
      setTimeout(() => {
        router.push(`/dashboard/events/edit/${newEvent.id}`)
      }, 100)
    } catch (error) {
      console.error('Failed to create event:', error)

      let errorMessage = 'Failed to create event. Please try again.'
      if (error instanceof Error) {
        if (error.message.includes('duplicate key') || error.message.includes('events_site_id_slug_key')) {
          errorMessage = 'An event with this name already exists. Please choose a different name.'
        } else {
          errorMessage = error.message
        }
      }

      toast.error(errorMessage, { id: toastId })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left pb-6 border-b">
          <DialogTitle className="text-2xl font-bold">Create New Event</DialogTitle>
          <DialogDescription>
            Enter the event title and date to get started. You can add more details later.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Summer Workshop" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Event Date */}
            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Event Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>When will this event take place?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t">
              <Button
                type="submit"
                disabled={isCreating}
                className="btn-gradient-primary"
              >
                {isCreating ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
