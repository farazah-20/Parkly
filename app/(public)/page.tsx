import { createClient } from '@/lib/supabase/server'
import { HeroSection }  from '@/components/public/HeroSection'
import { FadeInUp }     from '@/components/animations/FadeInUp'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer'
import { ShieldCheck, Clock, Star, Truck, ArrowRight } from 'lucide-react'

const USPS = [
  {
    num:   '01',
    icon:  Star,
    title: 'Anbieter vergleichen',
    text:  'Finden Sie den besten Parkplatz an Ihrem Flughafen – transparent und günstig.',
  },
  {
    num:   '02',
    icon:  ShieldCheck,
    title: 'Sicher buchen',
    text:  'SSL-verschlüsselt, flexible Stornierung bis 24 Stunden vor Abreise.',
  },
  {
    num:   '03',
    icon:  Truck,
    title: 'Shuttle oder Valet',
    text:  'Wählen Sie zwischen Shuttle-Transfer oder persönlichem Valet-Service.',
  },
  {
    num:   '04',
    icon:  Clock,
    title: '24/7 Support',
    text:  'Unser Team ist rund um die Uhr per Chat, Telefon und E-Mail erreichbar.',
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: airports } = await supabase
    .from('airports')
    .select('*')
    .order('city')

  return (
    <>
      {/* Animated Hero */}
      <HeroSection airports={airports ?? []} />

      {/* USP Section */}
      <section id="how-it-works" className="relative overflow-hidden bg-white py-24">
        {/* Subtle background accent */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(37,99,235,0.05),transparent)]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <FadeInUp>
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-block rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-600">
                So funktionierts
              </span>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
                Parken neu gedacht.
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Von der Suche bis zur Rückkehr — Parkly begleitet Sie durch jeden Schritt.
              </p>
            </div>
          </FadeInUp>

          <StaggerContainer className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {USPS.map(({ num, icon: Icon, title, text }) => (
              <StaggerItem key={num}>
                <div className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-md">
                  {/* Number watermark */}
                  <span className="absolute right-5 top-4 text-5xl font-black text-gray-50 select-none transition-colors duration-300 group-hover:text-brand-50">
                    {num}
                  </span>
                  {/* Icon */}
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 transition-colors duration-300 group-hover:bg-brand-100">
                    <Icon className="h-6 w-6 text-brand-600 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{text}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* B2B CTA */}
      <FadeInUp>
        <section className="relative overflow-hidden bg-gray-950 py-20 text-white">
          {/* Glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-300">
              Für Betreiber
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Sie sind Parkplatzbetreiber?
            </h2>
            <p className="mt-4 text-gray-400">
              Verwalten Sie Buchungen, Fahrer und Rechnungen in einem modernen Dashboard.
              Einfach einrichten, sofort loslegen.
            </p>
            <a
              href="/auth/operator-login"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-sm font-semibold transition-all duration-200 hover:bg-brand-500 hover:scale-105 active:scale-95"
            >
              Zum Betreiber-Login <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </FadeInUp>
    </>
  )
}
