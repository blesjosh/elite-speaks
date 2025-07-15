'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css' // Import the styles

export function DatePicker({
  selected,
  onSelect,
  disabled,
  className,
  initialFocus,
}: {
  selected?: Date
  onSelect: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
  initialFocus?: boolean
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        disabled={disabled}
        className="rounded-md border"
      />
    </div>
  )
}

export function DatePickerWithButton({
  selected,
  onSelect,
  disabled,
  placeholder = "Pick a date",
}: {
  selected?: Date
  onSelect: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  
  return (
    <div className="relative">
      <Button
        variant={"outline"}
        className={cn(
          "w-full justify-start text-left font-normal",
          !selected && "text-muted-foreground"
        )}
        onClick={() => setOpen(!open)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {selected ? format(selected, "PPP") : <span>{placeholder}</span>}
      </Button>
      
      {open && (
        <div className="absolute top-12 left-0 z-50 bg-white shadow-lg rounded-md border">
          <DatePicker
            selected={selected}
            onSelect={(date) => {
              onSelect(date)
              setOpen(false)
            }}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
}
