export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole         = 'admin' | 'operator' | 'driver' | 'customer'
export type BookingStatus    = 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled'
export type PaymentStatus    = 'pending' | 'paid' | 'refunded'
export type PaymentMethod    = 'cash' | 'card' | 'online' | 'invoice'
export type VehicleCondition = 'excellent' | 'good' | 'fair' | 'damaged'
export type InvoiceStatus    = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

// ─── Row types ───────────────────────────────────────────────────────────────

export interface Tenant {
  id:         string
  name:       string
  slug:       string
  email:      string
  phone:      string | null
  address:    string | null
  logo_url:   string | null
  settings:   Json
  is_active:  boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id:         string
  tenant_id:  string | null
  role:       UserRole
  first_name: string | null
  last_name:  string | null
  phone:      string | null
  avatar_url: string | null
  is_active:  boolean
  created_at: string
  updated_at: string
}

export interface Airport {
  id:         string
  name:       string
  iata_code:  string
  city:       string
  country:    string
  latitude:   number | null
  longitude:  number | null
  created_at: string
}

export interface ParkingLot {
  id:                   string
  tenant_id:            string
  airport_id:           string
  name:                 string
  description:          string | null
  address:              string
  distance_to_airport:  number | null
  price_per_day:        number
  total_capacity:       number
  available_spots:      number
  shuttle_available:    boolean
  valet_available:      boolean
  features:             string[]
  images:               string[]
  is_active:            boolean
  created_at:           string
  updated_at:           string
  // joined
  airport?:             Airport
  tenant?:              Tenant
}

export interface Driver {
  id:             string
  tenant_id:      string
  profile_id:     string | null
  first_name:     string
  last_name:      string
  email:          string
  phone:          string | null
  license_number: string | null
  is_active:      boolean
  created_at:     string
  updated_at:     string
}

export interface Booking {
  id:              string
  booking_number:  string
  tenant_id:       string
  parking_lot_id:  string
  customer_id:     string
  driver_id:       string | null
  flight_number:   string | null
  flight_departure: string | null
  flight_arrival:  string | null
  dropoff_date:    string
  pickup_date:     string
  total_days:      number
  price_per_day:   number
  total_amount:    number
  discount_amount: number
  status:          BookingStatus
  payment_status:  PaymentStatus
  payment_method:  PaymentMethod | null
  notes:           string | null
  created_at:      string
  updated_at:      string
  // joined
  parking_lot?:    ParkingLot
  customer?:       Profile
  driver?:         Driver
  vehicle?:        Vehicle
}

export interface Vehicle {
  id:            string
  booking_id:    string
  make:          string
  model:         string
  year:          number | null
  color:         string | null
  license_plate: string
  vin:           string | null
  created_at:    string
}

export interface CheckinProtocol {
  id:                      string
  booking_id:              string
  tenant_id:               string
  driver_id:               string | null
  parking_spot:            string | null
  checkin_at:              string | null
  checkin_mileage:         number | null
  checkin_fuel_level:      number | null
  checkin_condition:       VehicleCondition | null
  checkin_notes:           string | null
  checkin_photos:          string[]
  checkin_signature:       string | null
  checkin_signature_name:  string | null
  checkin_signed_at:       string | null
  checkout_at:             string | null
  checkout_mileage:        number | null
  checkout_fuel_level:     number | null
  checkout_condition:      VehicleCondition | null
  checkout_notes:          string | null
  checkout_photos:         string[]
  checkout_signature:      string | null
  checkout_signature_name: string | null
  checkout_signed_at:      string | null
  created_at:              string
  updated_at:              string
  // joined
  booking?:                Booking
  driver?:                 Driver
}

export interface InvoiceItem {
  description: string
  quantity:    number
  unit_price:  number
  total:       number
}

export interface Invoice {
  id:              string
  invoice_number:  string
  tenant_id:       string
  booking_id:      string | null
  customer_id:     string | null
  subtotal:        number
  tax_rate:        number
  tax_amount:      number
  total:           number
  status:          InvoiceStatus
  due_date:        string | null
  paid_at:         string | null
  payment_method:  PaymentMethod | null
  items:           InvoiceItem[]
  notes:           string | null
  pdf_url:         string | null
  sent_at:         string | null
  recipient_email: string | null
  created_at:      string
  updated_at:      string
  // joined
  booking?:        Booking
  customer?:       Profile
}

export interface DailyCash {
  id:              string
  tenant_id:       string
  date:            string
  opening_balance: number
  closing_balance: number | null
  total_cash:      number
  total_card:      number
  total_online:    number
  total_invoice:   number
  notes:           string | null
  closed_by:       string | null
  closed_at:       string | null
  created_at:      string
}

export interface Payment {
  id:            string
  tenant_id:     string
  booking_id:    string | null
  invoice_id:    string | null
  daily_cash_id: string | null
  amount:        number
  method:        PaymentMethod
  status:        PaymentStatus
  reference:     string | null
  processed_by:  string | null
  processed_at:  string | null
  created_at:    string
}

// ─── Database helper type (Supabase codegen style) ───────────────────────────
export interface Database {
  public: {
    Tables: {
      tenants:           { Row: Tenant;           Insert: Partial<Tenant>;           Update: Partial<Tenant>           }
      profiles:          { Row: Profile;          Insert: Partial<Profile>;          Update: Partial<Profile>          }
      airports:          { Row: Airport;          Insert: Partial<Airport>;          Update: Partial<Airport>          }
      parking_lots:      { Row: ParkingLot;       Insert: Partial<ParkingLot>;       Update: Partial<ParkingLot>       }
      drivers:           { Row: Driver;           Insert: Partial<Driver>;           Update: Partial<Driver>           }
      bookings:          { Row: Booking;          Insert: Partial<Booking>;          Update: Partial<Booking>          }
      vehicles:          { Row: Vehicle;          Insert: Partial<Vehicle>;          Update: Partial<Vehicle>          }
      checkin_protocols: { Row: CheckinProtocol;  Insert: Partial<CheckinProtocol>;  Update: Partial<CheckinProtocol>  }
      invoices:          { Row: Invoice;          Insert: Partial<Invoice>;          Update: Partial<Invoice>          }
      daily_cash:        { Row: DailyCash;        Insert: Partial<DailyCash>;        Update: Partial<DailyCash>        }
      payments:          { Row: Payment;          Insert: Partial<Payment>;          Update: Partial<Payment>          }
    }
  }
}
