import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { recordingId } = await request.json()
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Use a database function to handle the transaction
    const { data, error } = await supabase.rpc('submit_daily_recording', {
      recording_id: recordingId,
      user_id_in: user.id,
    })

    if (error) {
      console.error('RPC error:', error.message)
      // Check for specific error messages from the function
      if (error.message.includes('already submitted')) {
        return NextResponse.json({ error: 'You have already submitted a recording today.' }, { status: 409 });
      }
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Recording not found or does not belong to the user.' }, { status: 404 });
      }
      return NextResponse.json({ error: 'An error occurred during submission.' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Submission successful!', data })
  } catch (e) {
    console.error('Unexpected error:', e)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
