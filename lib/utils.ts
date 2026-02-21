import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, differenceInCalendarDays } from 'date-fns'
import { de } from 'date-fns/locale'

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format date for display */
export function formatDate(date: string | Date, pattern = 'dd.MM.yyyy') {
  return format(new Date(date), pattern, { locale: de })
}

/** Format datetime */
export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: de })
}

/** Format currency (EUR) */
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/** Calculate number of parking days */
export function calcParkingDays(dropoff: Date | string, pickup: Date | string) {
  const days = differenceInCalendarDays(new Date(pickup), new Date(dropoff))
  return Math.max(days, 1)
}

/** Calculate total booking price */
export function calcBookingTotal(pricePerDay: number, days: number, discount = 0) {
  return pricePerDay * days - discount
}

/** Generate initials from name */
export function getInitials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
}

/** Truncate text */
export function truncate(text: string, length = 80) {
  return text.length > length ? `${text.slice(0, length)}…` : text
}

/** Build full name */
export function fullName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ') || 'Unbekannt'
}
