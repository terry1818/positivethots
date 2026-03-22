-- Add unique constraint on subscriptions.user_id for upsert support
-- Also add RLS policies for service-role inserts/updates from webhook
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);

-- Allow service role to insert/update (webhook uses service role key)
-- The existing SELECT policy already lets users view their own subscription