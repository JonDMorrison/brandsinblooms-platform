'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Calendar as CalendarIcon, Loader2, X, Upload, Clock, Check, ChevronsUpDown, Star, Repeat } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover'
import { Calendar } from '@/src/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/src/components/ui/form'
import { Input } from '@/src/components/ui/input'
import { Switch } from '@/src/components/ui/switch'
import { Label } from '@/src/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/src/components/ui/command'
import { useEvent, useUpdateEvent, useAddEventMedia, useDeleteEventMedia, useAddEventAttachment, useDeleteEventAttachment } from '@/src/hooks/useEvents'
import { useSiteId } from '@/src/contexts/SiteContext'
import { RichTextEditor } from '@/src/components/content-editor/RichTextEditor'
import { PageAssociationsTab } from '@/src/components/events/PageAssociationsTab'
import { RepeatEventModal, type GeneratedOccurrence } from '@/src/components/events/RepeatEventModal'
import type { EventStatus } from '@/src/lib/queries/domains/events'
import { createEventOccurrence, updateEventOccurrence, setEventFeaturedImage } from '@/src/lib/queries/domains/events'
import { supabase } from '@/lib/supabase/client'
import { TIMEZONES, getUserTimezone } from '@/src/lib/timezones'
import { cn } from '@/lib/utils'

const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  is_all_day: z.boolean(),
  timezone: z.string(),
  location: z.string().optional(),
  status: z.enum(['draft', 'published', 'unpublished']),
})

type EventFormData = z.infer<typeof eventFormSchema>

interface EventOccurrence {
  id: string
  start_datetime: string
  end_datetime: string | null
  is_all_day: boolean
  location: string | null
}

type OccurrenceChange =
  | { type: 'add'; occurrence: Omit<EventOccurrence, 'id'> & { tempId: string } }
  | { type: 'update'; id: string; occurrence: Partial<EventOccurrence> }
  | { type: 'delete'; id: string }

interface EditEventPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditEventPage({ params }: EditEventPageProps) {
  const router = useRouter()
  const siteId = useSiteId()
  const [isUpdating, setIsUpdating] = useState(false)
  const [eventId, setEventId] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<EventStatus>('draft')

  // Saved state (from database)
  const [savedOccurrences, setSavedOccurrences] = useState<EventOccurrence[]>([])

  // Working state (client-side changes)
  const [stagedChanges, setStagedChanges] = useState<OccurrenceChange[]>([])
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const [isLoadingOccurrences, setIsLoadingOccurrences] = useState(false)
  const [isAddingDate, setIsAddingDate] = useState(false)
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [editingTime, setEditingTime] = useState<{
    occurrenceId: string
    field: 'start' | 'end'
    selectedHour: string | null
    selectedMinute: string | null
  } | null>(null)
  const [timezoneOpen, setTimezoneOpen] = useState(false)
  const [timezoneSearch, setTimezoneSearch] = useState('')
  const { data: event, loading: isLoadingEvent, error, refresh: refreshEvent } = useEvent(eventId || '')
  const { mutate: updateEvent } = useUpdateEvent()
  const addMediaMutation = useAddEventMedia()
  const deleteMediaMutation = useDeleteEventMedia()
  const addAttachmentMutation = useAddEventAttachment()
  const deleteAttachmentMutation = useDeleteEventAttachment()

  // Unwrap params promise
  useEffect(() => {
    params.then(({ id }) => setEventId(id))
  }, [params])

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      description: '',
      is_all_day: false,
      timezone: getUserTimezone(),
      location: '',
      status: 'draft',
    }
  })

  const isAllDay = form.watch('is_all_day')

  // Compute working occurrences (saved + staged changes)
  const workingOccurrences = (() => {
    // Start with saved occurrences
    let result = [...savedOccurrences]

    // Apply staged changes
    for (const change of stagedChanges) {
      if (change.type === 'delete') {
        result = result.filter(o => o.id !== change.id)
      } else if (change.type === 'update') {
        result = result.map(o =>
          o.id === change.id ? { ...o, ...change.occurrence } : o
        )
      } else if (change.type === 'add') {
        result.push({
          id: change.occurrence.tempId,
          start_datetime: change.occurrence.start_datetime,
          end_datetime: change.occurrence.end_datetime,
          is_all_day: change.occurrence.is_all_day,
          location: change.occurrence.location,
        })
      }
    }

    // Filter out deleting items (for animation)
    result = result.filter(o => !deletingIds.has(o.id))

    return result.sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
  })()

  const hasUnsavedChanges = stagedChanges.length > 0

  const loadOccurrences = useCallback(async () => {
    if (!eventId) return

    setIsLoadingOccurrences(true)
    try {
      const { data, error } = await supabase
        .from('event_occurrences')
        .select('*')
        .eq('event_id', eventId)
        .is('deleted_at', null)
        .order('start_datetime', { ascending: true })

      if (error) throw error

      setSavedOccurrences(data || [])
      setStagedChanges([]) // Reset staged changes when loading fresh from DB
    } catch (error) {
      console.error('Failed to load occurrences:', error)
      toast.error('Failed to load event dates')
    } finally {
      setIsLoadingOccurrences(false)
    }
  }, [eventId])

  // Load occurrences when event ID is available
  useEffect(() => {
    if (eventId && siteId) {
      loadOccurrences()
    }
  }, [eventId, siteId, loadOccurrences])

  // Populate form when event loads
  useEffect(() => {
    if (event) {
      const status = (event.status as EventStatus) || 'draft'

      form.reset({
        title: event.title,
        subtitle: event.subtitle || '',
        description: event.description || '',
        is_all_day: event.is_all_day || false,
        timezone: event.timezone || getUserTimezone(),
        location: event.location || '',
        status,
      })

      setCurrentStatus(status)
    }
  }, [event, form])

  const onSubmit = async (data: EventFormData) => {
    setIsUpdating(true)
    const toastId = toast.loading('Saving changes...')

    try {
      if (!eventId) {
        throw new Error('Event ID not found')
      }

      // Update event (without start/end datetime - those are in occurrences)
      await updateEvent({
        id: eventId,
        title: data.title,
        subtitle: data.subtitle || null,
        description: data.description || null,
        is_all_day: data.is_all_day,
        timezone: data.timezone,
        location: data.location || null,
        status: data.status,
      })

      // Apply staged occurrence changes to database
      for (const change of stagedChanges) {
        if (change.type === 'delete') {
          await supabase
            .from('event_occurrences')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', change.id)
        } else if (change.type === 'update') {
          await supabase
            .from('event_occurrences')
            .update(change.occurrence)
            .eq('id', change.id)
        } else if (change.type === 'add') {
          await supabase
            .from('event_occurrences')
            .insert({
              event_id: eventId,
              start_datetime: change.occurrence.start_datetime,
              end_datetime: change.occurrence.end_datetime,
              is_all_day: change.occurrence.is_all_day,
              location: change.occurrence.location,
            })
        }
      }

      // Reload occurrences from database
      await loadOccurrences()

      toast.success('Event updated successfully!', { id: toastId })
    } catch (error) {
      console.error('Failed to update event:', error)
      toast.error('Failed to update event. Please try again.', { id: toastId })
    } finally {
      setIsUpdating(false)
    }
  }

  const updateAllOccurrencesAllDay = (isAllDay: boolean) => {
    // Stage updates for all occurrences
    const updates: OccurrenceChange[] = workingOccurrences.map(occ => ({
      type: 'update' as const,
      id: occ.id,
      occurrence: { is_all_day: isAllDay }
    }))

    setStagedChanges(prev => [...prev, ...updates])
  }

  const stageAddOccurrence = (newOccurrence: Omit<EventOccurrence, 'id'>) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`
    setStagedChanges(prev => [
      ...prev,
      {
        type: 'add',
        occurrence: {
          tempId,
          ...newOccurrence
        }
      }
    ])
  }

  const addOccurrenceWithOffset = (daysOffset: number) => {
    if (workingOccurrences.length === 0) {
      toast.error('Please add at least one event date first')
      return
    }

    // Get the latest occurrence
    const latestOccurrence = workingOccurrences[workingOccurrences.length - 1]
    const latestStart = new Date(latestOccurrence.start_datetime)
    const latestEnd = latestOccurrence.end_datetime ? new Date(latestOccurrence.end_datetime) : null

    // Add offset days
    const newStart = addDays(latestStart, daysOffset)
    const newEnd = latestEnd ? addDays(latestEnd, daysOffset) : null

    stageAddOccurrence({
      start_datetime: newStart.toISOString(),
      end_datetime: newEnd ? newEnd.toISOString() : null,
      is_all_day: latestOccurrence.is_all_day,
      location: latestOccurrence.location,
    })
  }

  const deleteOccurrence = (occurrenceId: string) => {
    // Add to deleting set for animation
    setDeletingIds(prev => new Set([...prev, occurrenceId]))

    // Wait for animation to complete
    setTimeout(() => {
      // Check if this is a temp ID (staged add)
      const isTemp = occurrenceId.startsWith('temp-')

      if (isTemp) {
        // Remove from staged changes
        setStagedChanges(prev => prev.filter(
          change => !(change.type === 'add' && change.occurrence.tempId === occurrenceId)
        ))
      } else {
        // Stage deletion
        setStagedChanges(prev => [...prev, { type: 'delete', id: occurrenceId }])
      }

      // Remove from deleting set
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(occurrenceId)
        return next
      })
    }, 300) // Match animation duration
  }

  const updateTime = (
    occurrence: EventOccurrence,
    field: 'start' | 'end',
    hour: string,
    minute: string
  ) => {
    // Get the current datetime
    const currentDatetime = field === 'start' ? occurrence.start_datetime : (occurrence.end_datetime || occurrence.start_datetime)
    const currentDate = new Date(currentDatetime)

    // Create a new date with updated time
    const newDate = new Date(currentDate)
    newDate.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0)

    // Stage the update
    setStagedChanges(prev => [
      ...prev,
      {
        type: 'update',
        id: occurrence.id,
        occurrence: {
          [field === 'start' ? 'start_datetime' : 'end_datetime']: newDate.toISOString()
        }
      }
    ])
  }

  const handleRepeatEvent = (generatedOccurrences: GeneratedOccurrence[]) => {
    // Stage all generated occurrences
    for (const occ of generatedOccurrences) {
      stageAddOccurrence(occ)
    }

    toast.success(`${generatedOccurrences.length} occurrence${generatedOccurrences.length !== 1 ? 's' : ''} added`)
  }

  const handleCancelChanges = () => {
    setStagedChanges([])
    setDeletingIds(new Set())
    toast.info('Changes discarded')
  }

  // Handle time selection (no auto-save, only on Apply button)
  const handleTimeSelection = (
    type: 'hour' | 'minute',
    value: string
  ) => {
    if (!editingTime) return

    setEditingTime({
      ...editingTime,
      [type === 'hour' ? 'selectedHour' : 'selectedMinute']: value
    })
  }

  // Handle Apply button click
  const handleApplyTime = (occurrence: EventOccurrence, field: 'start' | 'end') => {
    if (!editingTime) return

    // Get current time as defaults if not selected
    const currentDatetime = field === 'start' ? occurrence.start_datetime : (occurrence.end_datetime || occurrence.start_datetime)
    const currentDate = new Date(currentDatetime)

    const hour = editingTime.selectedHour || format(currentDate, 'HH')
    const minute = editingTime.selectedMinute || format(currentDate, 'mm')

    updateTime(occurrence, field, hour, minute)
    setEditingTime(null)
  }

  // Drag and drop for images
  const onDropImages = useCallback(async (acceptedFiles: File[]) => {
    if (!eventId) return
    if (acceptedFiles.length === 0) return

    // Validate file sizes (5MB max per file)
    const maxSize = 5 * 1024 * 1024
    const invalidFiles = acceptedFiles.filter(file => file.size > maxSize)

    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} file(s) exceed the 5MB size limit`)
      return
    }

    setIsUploadingMedia(true)
    const toastId = toast.loading(`Uploading ${acceptedFiles.length} image(s)...`)

    try {
      const uploadPromises = acceptedFiles.map(async (file, index) => {
        // Upload to storage
        const fileName = `${eventId}/${Date.now()}-${index}-${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-media')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('event-media')
          .getPublicUrl(fileName)

        // Create media record
        await addMediaMutation.mutateAsync({
          eventId,
          media_type: 'image',
          media_url: publicUrl,
          thumbnail_url: publicUrl,
          alt_text: file.name,
          caption: null,
          sort_order: (event?.media?.length || 0) + index + 1
        })
      })

      await Promise.all(uploadPromises)

      toast.success(`${acceptedFiles.length} image(s) uploaded successfully`, { id: toastId })

      // Refresh event data to show uploaded images immediately
      await refreshEvent()
    } catch (error) {
      console.error('Failed to upload images:', error)
      toast.error('Failed to upload one or more images', { id: toastId })
    } finally {
      setIsUploadingMedia(false)
    }
  }, [eventId, event?.media?.length, addMediaMutation, refreshEvent])

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps, isDragActive: isImageDragActive } = useDropzone({
    onDrop: onDropImages,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp']
    },
    disabled: isUploadingMedia,
    multiple: true
  })

  // Drag and drop for attachments
  const onDropAttachments = useCallback(async (acceptedFiles: File[]) => {
    if (!eventId) return
    if (acceptedFiles.length === 0) return

    // Validate file sizes (10MB max per file)
    const maxSize = 10 * 1024 * 1024
    const invalidFiles = acceptedFiles.filter(file => file.size > maxSize)

    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} file(s) exceed the 10MB size limit`)
      return
    }

    setIsUploadingAttachment(true)
    const toastId = toast.loading(`Uploading ${acceptedFiles.length} file(s)...`)

    try {
      const uploadPromises = acceptedFiles.map(async (file, index) => {
        const fileName = `${eventId}/${Date.now()}-${index}-${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-attachments')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('event-attachments')
          .getPublicUrl(fileName)

        await addAttachmentMutation.mutateAsync({
          eventId,
          file_name: file.name,
          file_url: publicUrl,
          file_size_bytes: file.size,
          mime_type: file.type || 'application/octet-stream'
        })
      })

      await Promise.all(uploadPromises)

      toast.success(`${acceptedFiles.length} file(s) uploaded successfully`, { id: toastId })

      // Refresh event data to show uploaded attachments immediately
      await refreshEvent()
    } catch (error) {
      console.error('Failed to upload files:', error)
      toast.error('Failed to upload one or more files', { id: toastId })
    } finally {
      setIsUploadingAttachment(false)
    }
  }, [eventId, addAttachmentMutation, refreshEvent])

  const { getRootProps: getAttachmentRootProps, getInputProps: getAttachmentInputProps, isDragActive: isAttachmentDragActive } = useDropzone({
    onDrop: onDropAttachments,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/rtf': ['.rtf']
    },
    disabled: isUploadingAttachment,
    multiple: true
  })

  const addVideoUrl = async (url: string) => {
    if (!eventId) return
    if (!url.trim()) {
      toast.error('Please enter a video URL')
      return
    }

    const toastId = toast.loading('Adding video...')

    try {
      await addMediaMutation.mutateAsync({
        eventId,
        media_type: 'video',
        media_url: url,
        thumbnail_url: null,
        alt_text: 'Event video',
        caption: null,
        sort_order: 0
      })

      setVideoUrl('')
      toast.success('Video added successfully', { id: toastId })

      // Refresh event data to show video immediately
      await refreshEvent()
    } catch (error) {
      console.error('Failed to add video:', error)
      toast.error('Failed to add video', { id: toastId })
    }
  }

  const deleteMedia = async (mediaId: string) => {
    if (!eventId) return

    const toastId = toast.loading('Deleting media...')

    try {
      await deleteMediaMutation.mutateAsync({ mediaId, eventId })
      toast.success('Media deleted successfully', { id: toastId })

      // Refresh event data to update UI immediately
      await refreshEvent()
    } catch (error) {
      console.error('Failed to delete media:', error)
      toast.error('Failed to delete media', { id: toastId })
    }
  }

  const deleteAttachment = async (attachmentId: string) => {
    if (!eventId) return

    const toastId = toast.loading('Deleting attachment...')

    try {
      await deleteAttachmentMutation.mutateAsync({ attachmentId, eventId })
      toast.success('Attachment deleted successfully', { id: toastId })

      // Refresh event data to update UI immediately
      await refreshEvent()
    } catch (error) {
      console.error('Failed to delete attachment:', error)
      toast.error('Failed to delete attachment', { id: toastId })
    }
  }

  const setFeaturedImage = async (mediaId: string) => {
    if (!eventId || !siteId) return

    const toastId = toast.loading('Setting featured image...')

    try {
      await setEventFeaturedImage(supabase, siteId, eventId, mediaId)
      toast.success('Featured image updated', { id: toastId })

      // Refresh event data to update UI immediately
      await refreshEvent()
    } catch (error) {
      console.error('Failed to set featured image:', error)
      toast.error('Failed to set featured image', { id: toastId })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/dashboard/events')
      }
    } else {
      router.push('/dashboard/events')
    }
  }

  const handleStatusToggle = async (checked: boolean) => {
    if (!eventId) return

    const newStatus: EventStatus = checked ? 'published' : 'unpublished'
    setCurrentStatus(newStatus)

    try {
      await updateEvent({
        id: eventId,
        status: newStatus,
        published_at: checked ? new Date().toISOString() : null,
      })
      form.setValue('status', newStatus)
      toast.success(`Event ${checked ? 'published' : 'unpublished'} successfully`)
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status')
      // Revert on error
      setCurrentStatus(checked ? 'unpublished' : 'published')
    }
  }

  // Loading state (including params loading)
  if (!eventId || isLoadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Event</CardTitle>
            <CardDescription>
              {error.message || 'An unexpected error occurred while loading the event.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard/events')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not found state
  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>
              The event you&apos;re looking for doesn&apos;t exist or has been deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard/events')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filter timezones based on search
  const filteredTimezones = timezoneSearch
    ? TIMEZONES.filter(tz =>
        tz.label.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
        tz.value.toLowerCase().includes(timezoneSearch.toLowerCase())
      )
    : TIMEZONES

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Event</h1>
            <p className="text-muted-foreground mt-1">
              Update event details and settings
            </p>
          </div>
        </div>

        {/* Publish Toggle */}
        <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
          <Label htmlFor="publish-toggle" className="text-sm font-medium cursor-pointer">
            {currentStatus === 'published' ? 'Published' : currentStatus === 'draft' ? 'Draft' : 'Unpublished'}
          </Label>
          <Switch
            id="publish-toggle"
            checked={currentStatus === 'published'}
            onCheckedChange={handleStatusToggle}
          />
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="dates">Event Dates</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="associations">Page Associations</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                  <CardDescription>
                    Basic information about your event
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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

                  {/* Subtitle */}
                  <FormField
                    control={form.control}
                    name="subtitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtitle</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional tagline" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            initialContent={field.value || ''}
                            onChange={(html) => field.onChange(html)}
                            placeholder="Enter event description..."
                            siteId={siteId || undefined}
                            minHeight="200px"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Main Hall, 123 Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Event Dates Tab */}
            <TabsContent value="dates">
              <Card>
                <CardHeader>
                  <CardTitle>Event Dates</CardTitle>
                  <CardDescription>
                    Manage when this event occurs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Timezone - Searchable Combobox */}
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Event Timezone</FormLabel>
                        <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={timezoneOpen}
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? TIMEZONES.find((tz) => tz.value === field.value)?.label
                                  : "Select timezone"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0 bg-white" align="start">
                            <Command className="bg-white">
                              <CommandInput
                                placeholder="Search timezone..."
                                value={timezoneSearch}
                                onValueChange={setTimezoneSearch}
                              />
                              <CommandList>
                                <CommandEmpty>No timezone found.</CommandEmpty>
                                <CommandGroup className="max-h-[300px] overflow-y-auto">
                                  {filteredTimezones.map((timezone) => (
                                    <CommandItem
                                      key={timezone.value}
                                      value={timezone.value}
                                      onSelect={(currentValue) => {
                                        field.onChange(currentValue)
                                        setTimezoneOpen(false)
                                        setTimezoneSearch('')
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === timezone.value ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {timezone.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          All event times will be displayed in this timezone
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* All Day Toggle */}
                  <FormField
                    control={form.control}
                    name="is_all_day"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">All-Day Event</FormLabel>
                          <FormDescription>
                            Updates ALL event dates to be all-day or timed
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked)
                              updateAllOccurrencesAllDay(checked)
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Add Date Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Popover open={isAddingDate} onOpenChange={setIsAddingDate}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Add Date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white" align="start">
                        <Calendar
                          mode="single"
                          selected={undefined}
                          onSelect={(date) => {
                            if (date && eventId) {
                              const newDate = new Date(date)
                              newDate.setHours(9, 0, 0, 0) // Default 9am start

                              stageAddOccurrence({
                                start_datetime: newDate.toISOString(),
                                end_datetime: new Date(newDate.getTime() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours later
                                is_all_day: isAllDay,
                                location: form.getValues('location') || null,
                              })

                              setIsAddingDate(false)
                            }
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOccurrenceWithOffset(7)}
                      disabled={workingOccurrences.length === 0}
                    >
                      +7 Days
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOccurrenceWithOffset(30)}
                      disabled={workingOccurrences.length === 0}
                    >
                      +30 Days
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRepeatModalOpen(true)}
                      disabled={workingOccurrences.length === 0}
                    >
                      <Repeat className="h-4 w-4 mr-2" />
                      Repeat Event
                    </Button>
                  </div>

                  {/* Occurrences List */}
                  {isLoadingOccurrences ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : workingOccurrences.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg bg-muted/50">
                      <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No event dates yet. Click &quot;Add Date&quot; to create one.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {workingOccurrences.map((occurrence) => {
                        const isDeleting = deletingIds.has(occurrence.id)
                        const isNewlyAdded = occurrence.id.startsWith('temp-')

                        return (
                          <div
                            key={occurrence.id}
                            className={cn(
                              "flex items-center justify-between p-4 border rounded-lg transition-all duration-300",
                              isDeleting ? "opacity-0 scale-95 h-0 p-0 my-0 overflow-hidden" : "hover:bg-muted/50 opacity-100 scale-100",
                              isNewlyAdded && "animate-in fade-in slide-in-from-bottom-2"
                            )}
                          >
                          <div className="flex items-center gap-3 flex-1">
                            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="font-medium">
                                {format(new Date(occurrence.start_datetime), 'PPP')}
                              </div>
                              {occurrence.is_all_day ? (
                                <div className="text-sm text-muted-foreground">All Day</div>
                              ) : (
                                <div className="flex gap-2 items-center text-sm mt-1">
                                  {/* Start Time Picker */}
                                  <Popover
                                    open={editingTime?.occurrenceId === occurrence.id && editingTime.field === 'start'}
                                    onOpenChange={(open) => {
                                      if (open) {
                                        setEditingTime({
                                          occurrenceId: occurrence.id,
                                          field: 'start',
                                          selectedHour: null,
                                          selectedMinute: null
                                        })
                                      } else {
                                        setEditingTime(null)
                                      }
                                    }}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 px-3 font-mono"
                                      >
                                        <Clock className="h-3 w-3 mr-2" />
                                        {format(new Date(occurrence.start_datetime), 'h:mm a')}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-white" align="start">
                                      <div className="p-4 space-y-3 bg-white">
                                        <div className="flex gap-2 items-center">
                                          <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Hour</Label>
                                            <Select
                                              value={editingTime?.selectedHour || format(new Date(occurrence.start_datetime), 'HH')}
                                              onValueChange={(hour) => handleTimeSelection('hour', hour)}
                                            >
                                              <SelectTrigger className="w-20 bg-white">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent className="bg-white">
                                                {Array.from({ length: 24 }, (_, i) => (
                                                  <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                                    {i.toString().padStart(2, '0')}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Minute</Label>
                                            <Select
                                              value={editingTime?.selectedMinute || format(new Date(occurrence.start_datetime), 'mm')}
                                              onValueChange={(minute) => handleTimeSelection('minute', minute)}
                                            >
                                              <SelectTrigger className="w-20 bg-white">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent className="bg-white">
                                                {['00', '15', '30', '45'].map((min) => (
                                                  <SelectItem key={min} value={min}>{min}</SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                        <Button
                                          type="button"
                                          size="sm"
                                          className="w-full cursor-pointer"
                                          onClick={() => handleApplyTime(occurrence, 'start')}
                                          disabled={!editingTime?.selectedHour && !editingTime?.selectedMinute}
                                        >
                                          Apply
                                        </Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>

                                  <span className="text-muted-foreground">-</span>

                                  {/* End Time Picker */}
                                  <Popover
                                    open={editingTime?.occurrenceId === occurrence.id && editingTime.field === 'end'}
                                    onOpenChange={(open) => {
                                      if (open) {
                                        setEditingTime({
                                          occurrenceId: occurrence.id,
                                          field: 'end',
                                          selectedHour: null,
                                          selectedMinute: null
                                        })
                                      } else {
                                        setEditingTime(null)
                                      }
                                    }}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 px-3 font-mono"
                                      >
                                        <Clock className="h-3 w-3 mr-2" />
                                        {occurrence.end_datetime
                                          ? format(new Date(occurrence.end_datetime), 'h:mm a')
                                          : '5:00 PM'}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-white" align="start">
                                      <div className="p-4 space-y-3 bg-white">
                                        <div className="flex gap-2 items-center">
                                          <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Hour</Label>
                                            <Select
                                              value={editingTime?.selectedHour || (occurrence.end_datetime ? format(new Date(occurrence.end_datetime), 'HH') : '17')}
                                              onValueChange={(hour) => handleTimeSelection('hour', hour)}
                                            >
                                              <SelectTrigger className="w-20 bg-white">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent className="bg-white">
                                                {Array.from({ length: 24 }, (_, i) => (
                                                  <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                                    {i.toString().padStart(2, '0')}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Minute</Label>
                                            <Select
                                              value={editingTime?.selectedMinute || (occurrence.end_datetime ? format(new Date(occurrence.end_datetime), 'mm') : '00')}
                                              onValueChange={(minute) => handleTimeSelection('minute', minute)}
                                            >
                                              <SelectTrigger className="w-20 bg-white">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent className="bg-white">
                                                {['00', '15', '30', '45'].map((min) => (
                                                  <SelectItem key={min} value={min}>{min}</SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                        <Button
                                          type="button"
                                          size="sm"
                                          className="w-full cursor-pointer"
                                          onClick={() => handleApplyTime(occurrence, 'end')}
                                          disabled={!editingTime?.selectedHour && !editingTime?.selectedMinute}
                                        >
                                          Apply
                                        </Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteOccurrence(occurrence.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media">
              <Card>
                <CardHeader>
                  <CardTitle>Media</CardTitle>
                  <CardDescription>
                    Images, videos, and downloadable files for this event
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Videos Section - MOVED ABOVE IMAGES */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Video</h3>
                    {!event.media?.find(m => m.media_type === 'video') ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., YouTube, Vimeo, or any video URL"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={() => addVideoUrl(videoUrl)}
                          disabled={!videoUrl || addMediaMutation.loading}
                        >
                          {addMediaMutation.loading ? 'Adding...' : 'Add Video'}
                        </Button>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4">
                        {event.media?.filter(m => m.media_type === 'video').map(video => (
                          <div key={video.id} className="space-y-3">
                            {video.thumbnail_url && (
                              <img
                                src={video.thumbnail_url}
                                alt={video.alt_text || 'Video thumbnail'}
                                className="w-full h-48 object-cover rounded"
                              />
                            )}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-1">
                                <a
                                  href={video.media_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline break-all"
                                >
                                  {video.media_url}
                                </a>
                                {video.caption && (
                                  <p className="text-sm text-muted-foreground">{video.caption}</p>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteMedia(video.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                        <p className="text-sm text-muted-foreground mt-3">
                          Only one video per event is allowed. Remove the current video to add a new one.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Images Section with Drag and Drop */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Images</h3>

                    {/* Dropzone */}
                    <div
                      {...getImageRootProps()}
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                        isImageDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                        isUploadingMedia && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <input {...getImageInputProps()} />
                      <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      {isImageDragActive ? (
                        <p className="text-sm text-primary font-medium">Drop images here...</p>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {isUploadingMedia ? 'Uploading...' : 'Drag & drop images here, or click to select'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPEG, GIF, WebP - Max 5MB per file
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Image Grid */}
                    {event.media?.filter(m => m.media_type === 'image').length ? (
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {event.media?.filter(m => m.media_type === 'image').map(img => {
                          const isFeatured = event.featured_image_id === img.id
                          return (
                            <div key={img.id} className="relative group border rounded-lg p-2">
                              <div className="relative">
                                <img
                                  src={img.thumbnail_url || img.media_url}
                                  alt={img.alt_text || ''}
                                  className="w-full h-32 object-cover rounded"
                                />
                                {isFeatured && (
                                  <Badge
                                    className="absolute top-2 left-2 bg-primary text-primary-foreground flex items-center gap-1"
                                  >
                                    <Star className="h-3 w-3 fill-current" />
                                    Featured
                                  </Badge>
                                )}
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                  onClick={() => deleteMedia(img.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              {img.caption && (
                                <p className="text-sm text-muted-foreground mt-2">{img.caption}</p>
                              )}
                              {!isFeatured && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full mt-2"
                                  onClick={() => setFeaturedImage(img.id)}
                                >
                                  <Star className="h-3 w-3 mr-1" />
                                  Set as Featured
                                </Button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>

                  {/* Attachments Section with Drag and Drop */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Downloads</h3>

                    {/* Dropzone */}
                    <div
                      {...getAttachmentRootProps()}
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                        isAttachmentDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                        isUploadingAttachment && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <input {...getAttachmentInputProps()} />
                      <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      {isAttachmentDragActive ? (
                        <p className="text-sm text-primary font-medium">Drop files here...</p>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {isUploadingAttachment ? 'Uploading...' : 'Drag & drop files here, or click to select'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, RTF - Max 10MB per file
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Attachments List */}
                    {event.attachments && event.attachments.length > 0 ? (
                      <div className="space-y-2 mt-4">
                        {event.attachments.map(attachment => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{attachment.file_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {attachment.file_size_bytes
                                  ? formatFileSize(attachment.file_size_bytes)
                                  : 'Unknown size'}
                                {attachment.mime_type && ` • ${attachment.mime_type}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <a
                                  href={attachment.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                >
                                  Download
                                </a>
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteAttachment(attachment.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Page Associations Tab */}
            <TabsContent value="associations">
              {eventId && siteId && (
                <PageAssociationsTab eventId={eventId} siteId={siteId} />
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3">
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="text-sm">
                {stagedChanges.length} unsaved change{stagedChanges.length !== 1 ? 's' : ''}
              </Badge>
            )}
            <div className="flex gap-3 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelChanges}
                disabled={isUpdating || !hasUnsavedChanges}
              >
                Discard Changes
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="btn-gradient-primary"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Repeat Event Modal */}
      {workingOccurrences.length > 0 && (
        <RepeatEventModal
          open={isRepeatModalOpen}
          onOpenChange={setIsRepeatModalOpen}
          onGenerate={handleRepeatEvent}
          baseOccurrence={workingOccurrences[workingOccurrences.length - 1]}
          existingOccurrences={workingOccurrences}
        />
      )}
    </div>
  )
}
