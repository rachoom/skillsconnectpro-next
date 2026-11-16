alter table public.provider_responses
  add column if not exists customer_clarification text,
  add column if not exists customer_clarification_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'provider_responses_customer_clarification_length'
      and conrelid = 'public.provider_responses'::regclass
  ) then
    alter table public.provider_responses
      add constraint provider_responses_customer_clarification_length
      check (
        customer_clarification is null
        or char_length(customer_clarification) <= 600
      );
  end if;
end $$;
