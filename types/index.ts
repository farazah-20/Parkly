export * from './database.types'

// ─── UI / Form types ──────────────────────────────────────────────────────────

export interface SearchParams {
  airport:  string
  checkin:  string
  checkout: string
}

export interface BookingFormData {
  // Step 1 – Vehicle
  make:          string
  model:         string
  year:          number
  color:         string
  license_plate: string
  // Step 2 – Flight
  flight_number:   string
  flight_departure?: string
  flight_arrival?:  string
  // Step 3 – Dates & Notes
  dropoff_date: string
  pickup_date:  string
  notes?:       string
  // Step 4 – Payment
  payment_method: string
}

export interface DriverFormData {
  first_name:     string
  last_name:      string
  email:          string
  phone?:         string
  license_number?: string
  create_account: boolean
  password?:      string
}

export interface CheckinFormData {
  booking_id:      string
  parking_spot?:   string
  mileage:         number
  fuel_level:      number
  condition:       string
  notes?:          string
  signature:       string   // Base64 PNG
  signatory_name:  string
}

export interface InvoiceFormData {
  booking_id?:     string
  customer_id:     string
  items:           InvoiceLineItem[]
  tax_rate:        number
  due_date?:       string
  notes?:          string
  recipient_email: string
}

export interface InvoiceLineItem {
  description: string
  quantity:    number
  unit_price:  number
}

// ─── API response wrappers ───────────────────────────────────────────────────
export interface ApiSuccess<T> {
  data:    T
  error?:  never
}

export interface ApiError {
  data?:   never
  error:   string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
