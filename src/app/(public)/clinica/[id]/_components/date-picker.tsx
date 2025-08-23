"use client"

import { useState } from "react"
import DatePicker, { registerLocale } from 'react-datepicker'
import { ptBR } from 'date-fns/locale/pt-BR'
import 'react-datepicker/dist/react-datepicker.css'

registerLocale('pt-BR', ptBR)

interface DateTimePickerProps {
  minDate?: Date;
  className?: string;
  initialDate?: Date;
  onChange: (date: Date) => void;
} 

export function DatePickerComponent({
  minDate,
  className,
  initialDate,
  onChange,
}: DateTimePickerProps){
  const [startDate, setStartDate] = useState(initialDate || new Date())

  function handleChange(date: Date | null) {
    if (date) {
      setStartDate(date)
      onChange(date)
    }
  }

  return (
    <DatePicker 
    className={className} 
    locale="pt-BR" 
    selected={startDate} 
    minDate={minDate ?? new Date()} 
    onChange={handleChange} 
    dateFormat="dd/MM/yyyy"
    
    />
  )

}