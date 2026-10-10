-- Fix ticket webhook idempotency.
--
-- The application persists ticket_financial_events with
-- ON CONFLICT (stripe_event_id). A partial unique index does not satisfy
-- that conflict target in PostgreSQL, even though it prevents duplicate
-- non-null values. A normal unique index does: PostgreSQL still permits
-- multiple NULL values, while making the webhook upsert inferable.

DROP INDEX IF EXISTS public.ticket_financial_events_stripe_event_unique;

CREATE UNIQUE INDEX ticket_financial_events_stripe_event_unique
  ON public.ticket_financial_events (stripe_event_id);
