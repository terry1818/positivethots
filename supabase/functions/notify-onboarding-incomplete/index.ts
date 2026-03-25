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
  const now = Date.now()
  let processed = 0

  // --- 24h push notification window (23-25h after onboarding_started_at) ---
  const pushFrom = new Date(now - 25 * 3600_000).toISOString()
  const pushTo = new Date(now - 23 * 3600_000).toISOString()

  const { data: pushTargets } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('onboarding_completed', false)
    .gte('onboarding_started_at', pushFrom)
    .lte('onboarding_started_at', pushTo)

  if (pushTargets) {
    for (const profile of pushTargets) {
      // Check if already notified
      const { data: alreadySent } = await supabase
        .from('analytics_events')
        .select('id')
        .eq('user_id', profile.id)
        .eq('event_name', 'push_notification_sent')
        .limit(1)

      if (alreadySent && alreadySent.length > 0) continue

      // Check device token exists
      const { data: tokens } = await supabase
        .from('device_tokens')
        .select('token')
        .eq('user_id', profile.id)
        .limit(1)

      if (tokens && tokens.length > 0) {
        // Send push notification
        await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: profile.id,
            title: 'Almost there! 🌟',
            body: "You're close to unlocking Discovery. Finish setting up your profile.",
            data: { url: '/onboarding' },
          },
        })

        await supabase.from('analytics_events').insert({
          user_id: profile.id,
          event_name: 'push_notification_sent',
          event_data: { type: 'onboarding_nudge' },
        })
        processed++
      }
    }
  }

  // --- 48h email window (47-49h after onboarding_started_at) ---
  const emailFrom = new Date(now - 49 * 3600_000).toISOString()
  const emailTo = new Date(now - 47 * 3600_000).toISOString()

  const { data: emailTargets } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('onboarding_completed', false)
    .gte('onboarding_started_at', emailFrom)
    .lte('onboarding_started_at', emailTo)

  if (emailTargets) {
    for (const profile of emailTargets) {
      // Check if email already sent
      const { data: alreadySent } = await supabase
        .from('analytics_events')
        .select('id')
        .eq('user_id', profile.id)
        .eq('event_name', 'onboarding_incomplete_email_sent')
        .limit(1)

      if (alreadySent && alreadySent.length > 0) continue

      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(profile.id)
      if (!userData?.user?.email) continue

      const firstName = profile.name?.split(' ')[0] || null

      const { error: sendError } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'onboarding-incomplete',
          recipientEmail: userData.user.email,
          templateData: { firstName },
        },
      })

      if (!sendError) {
        await supabase.from('analytics_events').insert({
          user_id: profile.id,
          event_name: 'onboarding_incomplete_email_sent',
        })
        processed++
      }
    }
  }

  console.log(`Onboarding incomplete: processed ${processed} notifications`)

  return new Response(JSON.stringify({ processed }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
