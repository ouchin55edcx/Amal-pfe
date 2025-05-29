// DoctorAvailabilityCalendar.tsx
'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/Calendar';

interface DoctorAvailabilityCalendarProps {
  readonly disponibilite: string[];
  readonly onDateSelect?: (date: Date) => void;
}

export function DoctorAvailabilityCalendar({
  disponibilite,
  onDateSelect,
}: DoctorAvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onDateSelect) {
      onDateSelect(date);
    }
  };

  return (
    <Calendar
      mode='single'
      selected={selectedDate}
      onSelect={handleDateSelect}
      className='border-none shadow-none'
      disabled={(date) =>
        !disponibilite.includes(date.toISOString().split('T')[0])
      }
    />
  );
}
