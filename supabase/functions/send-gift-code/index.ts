import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { rateLimit, rateLimitResponse } from '../_shared/rate-limit.ts'
import { sendLoggedTemplateEmail } from '../_shared/transactional-email-templates/send-logged.ts'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const { limited } = rateLimit(req, 20)
  if (limited) return rateLimitResponse(corsHeaders)

  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const authHeader = req.headers.get('Authorization') || ''
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401)
  const user = userData.user

  let code: string, recipient: string
  try {
    const body = await req.json()
    code = String(body.code ?? '').trim()
    recipient = String(body.recipientEmail ?? '').trim()
  } catch {
    return json({ error: 'Invalid JSON in request body' }, 400)
  }
  if (!/^[A-Z0-9]{4,32}$/.test(code)) return json({ error: 'Invalid code' }, 400)
  if (recipient.length > 255 || !EMAIL_REGEX.test(recipient)) return json({ error: 'Invalid email address format' }, 400)

  const supabase = createClient(url, serviceKey)
  const { data: promo } = await supabase
    .from('promo_codes')
    .select('code, tier, trial_days')
    .eq('code', code)
    .eq('type', 'gift')
    .eq('created_by', user.id)
    .maybeSingle()
  if (!promo) return json({ error: 'Gift code not found' }, 404)

  const oneHourAgo = new Date(Date.now() - 3600_000).toISOString()
  const { count: recipientCount } = await supabase
    .from('email_send_log').select('id', { count: 'exact', head: true })
    .eq('recipient_email', recipient.toLowerCase()).gte('created_at', oneHourAgo)
  if (recipientCount && recipientCount >= 5)
    return json({ error: 'Too many emails to this recipient. Please try again later.' }, 429)
  const { count: callerCount } = await supabase
    .from('email_send_log').select('id', { count: 'exact', head: true })
    .eq('metadata->>caller_id', user.id).gte('created_at', oneHourAgo)
  if (callerCount && callerCount >= 10)
    return json({ error: 'You have sent too many emails. Please try again later.' }, 429)

  const tier = String(promo.tier ?? '')
  try {
    const result = await sendLoggedTemplateEmail(supabase, 'gift-code', recipient.toLowerCase(), {
      templateData: {
        code,
        tier: tier.charAt(0).toUpperCase() + tier.slice(1),
        days: String(promo.trial_days ?? ''),
        senderName: user.user_metadata?.name || 'A friend',
      },
      idempotencyKey: `gift-${code}`,
      callerId: user.id,
    })
    return json(result.sent ? { success: true } : { success: false, reason: 'email_suppressed' })
  } catch (err) {
    console.error('Gift email failed', { message: err instanceof Error ? err.message : String(err) })
    return json({ error: 'Failed to send email' }, 500)
  }
})
