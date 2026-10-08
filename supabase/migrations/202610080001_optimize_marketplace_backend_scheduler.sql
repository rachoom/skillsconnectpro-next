-- Reduce idle marketplace scheduler traffic while preserving immediate routing.
--
-- New projects are routed synchronously by the intake API. This cron remains a
-- recovery/expansion and completion-follow-up safety net. It only calls the
-- Vercel endpoint when there is eligible work.

select cron.schedule(
  'skillsconnectpro-marketplace-routing',
  '*/5 * * * *',
  $job$
    select net.http_get(
      url := 'https://www.skillsconnectpro.co.za/api/cron/marketplace-routing',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'skillsconnectpro_marketplace_cron_bearer'
          order by created_at desc
          limit 1
        )
      ),
      timeout_milliseconds := 55000
    ) as request_id
    where exists (
      select 1
      from public.projects
      where consent_to_share = true
        and status in ('assessment_complete', 'matching', 'responses_received')
    )
    or exists (
      select 1
      from public.project_matches
      where status = 'in_progress'
        and completion_reported_at is not null
    );
  $job$
);
