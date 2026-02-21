export const APP_NAME = 'Parkly'
export const APP_TAGLINE = 'Ihr smarter Parkplatz-Partner'

export const ROLES = {
  ADMIN:    'admin',
  OPERATOR: 'operator',
  DRIVER:   'driver',
  CUSTOMER: 'customer',
} as const

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending:    'Ausstehend',
  confirmed:  'Bestätigt',
  checked_in: 'Eingecheckt',
  completed:  'Abgeschlossen',
  cancelled:  'Storniert',
}

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  checked_in: 'bg-purple-100 text-purple-800',
  completed:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending:  'Offen',
  paid:     'Bezahlt',
  refunded: 'Erstattet',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash:    'Bar',
  card:    'Karte',
  online:  'Online',
  invoice: 'Rechnung',
}

export const VEHICLE_CONDITION_LABELS: Record<string, string> = {
  excellent: 'Sehr gut',
  good:      'Gut',
  fair:      'Befriedigend',
  damaged:   'Beschädigt',
}

export const FUEL_LEVEL_LABELS: Record<number, string> = {
  0:   'Leer',
  25:  '1/4',
  50:  '1/2',
  75:  '3/4',
  100: 'Voll',
}

export const FEATURES_LABELS: Record<string, string> = {
  covered:     'Überdacht',
  open_air:    'Freigelände',
  cctv:        'Videoüberwachung',
  '24h':       '24/7 geöffnet',
  valet:       'Valet-Service',
  shuttle:     'Shuttle-Service',
  ev_charging: 'E-Ladesäulen',
  indoor:      'Innengarage',
}

export const OPERATOR_NAV = [
  { label: 'Dashboard',    href: '/operator/dashboard',      icon: 'LayoutDashboard' },
  { label: 'Parkplätze',   href: '/operator/parking',        icon: 'ParkingSquare'  },
  { label: 'Buchungen',    href: '/operator/bookings',        icon: 'CalendarDays'   },
  { label: 'Fahrer',       href: '/operator/drivers',         icon: 'Users'          },
  { label: 'Check-in/out', href: '/operator/checkin',         icon: 'ClipboardCheck' },
  { label: 'Tageskasse',   href: '/operator/cash-register',   icon: 'Banknote'       },
  { label: 'Rechnungen',   href: '/operator/invoices',        icon: 'FileText'       },
] as const

export const DRIVER_NAV = [
  { label: 'Meine Aufgaben', href: '/driver/dashboard', icon: 'ClipboardList' },
  { label: 'Check-in/out',   href: '/driver/checkin',   icon: 'ClipboardCheck' },
] as const
