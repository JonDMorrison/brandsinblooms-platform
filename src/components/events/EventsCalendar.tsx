'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { CalendarEventDTO } from '@/src/lib/events/types'
import Link from 'next/link'

interface EventsCalendarProps {
    domain: string
}

export default function EventsCalendar({ domain }: EventsCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState<CalendarEventDTO[]>([])
    const [loading, setLoading] = useState(false)

    // Calculate start/end of current month view (including padding days)
    const getMonthRange = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()

        // First day of month
        const firstDay = new Date(year, month, 1)
        // Last day of month
        const lastDay = new Date(year, month + 1, 0)

        // Start from Sunday before first day (or first day if Sunday)
        const startDate = new Date(firstDay)
        startDate.setDate(firstDay.getDate() - firstDay.getDay())

        // End at Saturday after last day (or last day if Saturday)
        const endDate = new Date(lastDay)
        endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()))

        return { startDate, endDate }
    }

    const fetchEvents = async () => {
        setLoading(true)
        try {
            const { startDate, endDate } = getMonthRange(currentDate)

            const params = new URLSearchParams({
                start: startDate.toISOString(),
                end: endDate.toISOString(),
            })

            const res = await fetch(`/api/events/calendar?${params.toString()}`)
            if (!res.ok) throw new Error('Failed to fetch events')

            const data = await res.json()
            setEvents(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEvents()
    }, [currentDate])

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    const today = () => {
        setCurrentDate(new Date())
    }

    // Render Calendar Grid
    const renderCalendar = () => {
        const { startDate, endDate } = getMonthRange(currentDate)
        const days = []
        let day = new Date(startDate)

        while (day <= endDate) {
            days.push(new Date(day))
            day.setDate(day.getDate() + 1)
        }

        return (
            <div className="grid grid-cols-7 gap-px bg-muted border rounded-lg overflow-hidden">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="bg-background p-2 text-center text-sm font-medium text-muted-foreground">
                        {d}
                    </div>
                ))}

                {days.map((d, idx) => {
                    const isCurrentMonth = d.getMonth() === currentDate.getMonth()
                    const isToday = d.toDateString() === new Date().toDateString()

                    // Find events for this day
                    const dayEvents = events.filter(e => {
                        const eventStart = new Date(e.start)
                        return eventStart.toDateString() === d.toDateString()
                    })

                    return (
                        <div
                            key={idx}
                            className={`bg-background min-h-[120px] p-2 transition-colors hover:bg-muted/10 ${!isCurrentMonth ? 'text-muted-foreground bg-muted/5' : ''
                                }`}
                        >
                            <div className={`text-right text-sm mb-1 ${isToday ? 'font-bold text-primary' : ''}`}>
                                <span className={isToday ? 'bg-primary/10 px-2 py-1 rounded-full' : ''}>
                                    {d.getDate()}
                                </span>
                            </div>

                            <div className="space-y-1">
                                {dayEvents.map(event => (
                                    <Link
                                        key={event.id}
                                        href={event.url}
                                        className="block text-xs bg-primary/10 text-primary px-1.5 py-1 rounded truncate hover:bg-primary/20 transition-colors"
                                        title={event.title}
                                    >
                                        {event.allDay ? '' : new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' '}
                                        {event.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={today}
                        className="px-3 py-1 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                        aria-label="Next month"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {renderCalendar()}
        </div>
    )
}
