import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

const OPERATOR_PATHS = ['/operator']
const CUSTOMER_PATHS = ['/customer']
const DRIVER_PATHS   = ['/driver']

export async function middleware(request: NextRequest) {
  // Refresh the session cookie and get the current user
  const { response, user } = await updateSession(request)
  const path = request.nextUrl.pathname

  const redirect = (href: string) =>
    NextResponse.redirect(new URL(href, request.url))

  if (OPERATOR_PATHS.some(p => path.startsWith(p)) && !user) {
    return redirect('/auth/operator-login')
  }

  if (CUSTOMER_PATHS.some(p => path.startsWith(p)) && !user) {
    return redirect('/auth/login')
  }

  if (DRIVER_PATHS.some(p => path.startsWith(p)) && !user) {
    return redirect('/auth/login')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and Next.js internals.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
