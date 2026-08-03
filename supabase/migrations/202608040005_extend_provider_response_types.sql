-- Extend provider response availability choices for planned and large projects.

alter table public.provider_responses
  drop constraint provider_responses_response_type_check;

alter table public.provider_responses
  add constraint provider_responses_response_type_check
  check (
    response_type in (
      'available_now',
      'available_today',
      'available_tomorrow',
      'available_this_week',
      'available_next_week',
      'site_visit',
      'estimate',
      'need_information',
      'declined'
    )
  );
