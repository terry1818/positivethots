import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Find checkout_abandoned events from 55-65 minutes ago
  const now = Date.now()
  const from = new Date(now - 65 * 60_000).toISOString()
  const to = new Date(now - 55 * 60_000).toISOString()

  const { data: abandonedEvents, error: fetchError } = await supabase
    .from('analytics_events')
    .select('user_id, event_data, created_at')
    .eq('event_name', 'checkout_abandoned')
    .gte('created_at', from)
    .lte('created_at', to)

  if (fetchError || !abandonedEvents || abandonedEvents.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let processed = 0

  for (const event of abandonedEvents) {
    if (!event.user_id) continue

    // Check if recovery email already sent for this user
    const { data: alreadySent } = await supabase
      .from('analytics_events')
      .select('id')
      .eq('user_id', event.user_id)
      .eq('event_name', 'abandoned_checkout_email_sent')
      .gte('created_at', from)
      .limit(1)

    if (alreadySent && alreadySent.length > 0) continue

    // Check if user completed checkout since abandonment
    const { data: completed } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', event.user_id)
      .eq('status', 'active')
      .limit(1)

    if (completed && completed.length > 0) continue

    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(event.user_id)
    if (!userData?.user?.email) continue

    const firstName = userData.user.user_metadata?.name?.split(' ')[0] || null

    // Send recovery email via send-transactional-email
    const { error: sendError } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'abandoned-checkout',
        recipientEmail: userData.user.email,
        templateData: { firstName },
      },
    })

    if (!sendError) {
      // Mark as sent
      await supabase.from('analytics_events').insert({
        user_id: event.user_id,
        event_name: 'abandoned_checkout_email_sent',
      })
      processed++
    }
  }

  console.log(`Processed ${processed} abandoned checkout recovery emails`)

  return new Response(JSON.stringify({ processed }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
