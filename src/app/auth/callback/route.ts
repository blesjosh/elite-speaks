import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    try {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      await supabase.auth.exchangeCodeForSession(code)
      
      // URL to redirect to after sign in process completes
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    } catch (error) {
      console.error('Auth callback error:', error)
      // Redirect to login page with error
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_failed`)
    }
  }

  // If no code is present, redirect to home
  return NextResponse.redirect(requestUrl.origin)
}
