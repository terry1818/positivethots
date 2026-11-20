import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmail, type SendTemplateEmailResult } from './send-email.ts'

// Sends through the managed helper and keeps the app's email_send_log rows
// ('sent' / 'suppressed' / 'failed'), which per-recipient limits read.
export async function sendLoggedTemplateEmail(
  supabase: SupabaseClient,
  templateName: string,
  to: string,
  opts: { templateData?: Record<string, any>; idempotencyKey?: string; callerId?: string | null } = {},
): Promise<SendTemplateEmailResult> {
  const base = {
    message_id: null,
    template_name: templateName,
    recipient_email: to,
    metadata: opts.callerId ? { caller_id: opts.callerId } : null,
  }
  const log = async (row: Record<string, unknown>) => {
    const { error } = await supabase.from('email_send_log').insert({ ...base, ...row })
    if (error) console.error('email_send_log insert failed', { code: error.code, message: error.message })
  }
  try {
    const result = await sendTemplateEmail(templateName, to, {
      templateData: opts.templateData,
      idempotencyKey: opts.idempotencyKey,
    })
    await log({ status: result.sent ? 'sent' : 'suppressed' })
    if (result.sent) {
      const { error } = await supabase.from('analytics_events').insert({
        event_name: 'email_sent',
        event_data: { template: templateName },
      })
      if (error) console.error('analytics insert failed', { code: error.code })
    }
    return result
  } catch (err) {
    await log({ status: 'failed', error_message: err instanceof Error ? err.message : String(err) })
    throw err
  }
}
