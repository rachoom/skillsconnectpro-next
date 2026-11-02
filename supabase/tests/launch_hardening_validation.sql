-- Run ONLY in a rollback-only staging transaction after loading the candidate
-- migrations. No real user, provider, payment, message or model call is used.
do $$
declare
 u uuid := gen_random_uuid(); a jsonb; b jsonb; n integer;
begin
 insert into auth.users(id,email) values(u,'scp-validation-'||u||'@example.invalid');
 a:=public.reserve_customer_photo_image(u,repeat('a',64));
 assert (a->>'allowed')::boolean, 'free first photo denied';
 b:=public.reserve_customer_photo_image(u,repeat('a',64));
 assert b->>'reason'='processing', 'pending duplicate not blocked';
 assert public.finish_customer_photo_image(u,(a->>'reservation_id')::uuid,true), 'settlement failed';
 b:=public.reserve_customer_photo_image(u,repeat('a',64));
 assert (b->>'allowed')::boolean and b->>'reservation_id' is null, 'replay charged twice';
 b:=public.reserve_customer_photo_image(u,repeat('b',64));
 assert b->>'reason'='limit', 'free limit bypass';

 insert into public.account_subscriptions(user_id,plan_code,status,starts_at,ends_at)
 values(u,'basic_30','active',now()-interval '1 day',now()+interval '1 day');
 a:=public.reserve_customer_photo_image(u,repeat('b',64));
 assert public.finish_customer_photo_image(u,(a->>'reservation_id')::uuid,false), 'refund failed';
 assert not public.finish_customer_photo_image(u,(a->>'reservation_id')::uuid,false), 'double refund accepted';
 select used into n from public.usage_allowances where user_id=u and allowance_type='ai_assessments';
 assert n=0, 'refund count incorrect';
 a:=public.reserve_customer_photo_image(u,repeat('b',64));
 assert public.finish_customer_photo_image(u,(a->>'reservation_id')::uuid,true), 'Basic settlement failed';
 b:=public.reserve_customer_photo_image(u,repeat('c',64));
 assert public.finish_customer_photo_image(u,(b->>'reservation_id')::uuid,true), 'Basic second settlement failed';
 b:=public.reserve_customer_photo_image(u,repeat('d',64));
 assert b->>'reason'='limit', 'Basic third photo not blocked';

 update public.account_subscriptions set ends_at=ends_at+interval '30 days' where user_id=u;
 b:=public.reserve_customer_photo_image(u,repeat('d',64));
 assert (b->>'allowed')::boolean, 'new period failed to reset allowance';
 -- A different image must recover an abandoned slot, not require re-uploading
 -- the abandoned image first.
 a:=public.reserve_customer_photo_image(u,repeat('e',64));
 update public.customer_photo_assessments set reserved_until=now()-interval '1 second'
 where user_id=u and status='pending';
 b:=public.reserve_customer_photo_image(u,repeat('f',64));
 assert (b->>'allowed')::boolean, 'abandoned images did not release allowance';

 update public.account_subscriptions set status='expired',ends_at=now()-interval '1 second' where user_id=u;
 b:=public.reserve_customer_photo_image(u,repeat('1',64));
 assert b->>'plan_code'='free', 'expired Basic still grants paid access';
 insert into public.account_subscriptions(user_id,plan_code,status,starts_at,ends_at)
 values(u,'project_pass_90','active',now()-interval '1 day',now()+interval '90 days');
 for n in 1..5 loop
  a:=public.reserve_customer_photo_image(u,md5(n::text)||md5(n::text));
  assert (a->>'allowed')::boolean, 'Pass photo denied before fifth';
  assert public.finish_customer_photo_image(u,(a->>'reservation_id')::uuid,true), 'Pass settlement failed';
 end loop;
 a:=public.reserve_customer_photo_image(u,repeat('a',64));
 assert a->>'reason'='limit', 'Pass sixth photo not blocked';
end $$;

do $$
declare
 provider integer := 100000000 + floor(random()*100000000)::integer;
 project_id uuid; invitation uuid; result jsonb; count_before integer;
 payment_ref text := 'validation-'||gen_random_uuid(); processor_ref text := 'validation-'||gen_random_uuid();
begin
 insert into public.artisans(id,first_name,last_name,phone)
 values(provider,'Validation','Only','invalid-'||gen_random_uuid());
 -- First three responses are free; the fourth needs an entitlement.
 for n in 1..4 loop
  insert into public.projects(title,customer_description,category,location_text,status,source_channel)
  values('Validation only','Rollback-only validation','plumber','Validation','matching','admin') returning id into project_id;
  insert into public.lead_invitations(project_id,provider_id,status,response_token_expires_at)
  values(project_id,provider::text,'sent',now()+interval '1 hour') returning id into invitation;
  if n<=3 then
   result:=public.submit_provider_response_billed(invitation,'available_this_week');
   assert result->>'chargeType'='free', 'free response was charged';
  else
   begin
    perform public.submit_provider_response_billed(invitation,'available_now');
    raise exception 'fourth response bypassed limit';
   exception when others then
    if sqlerrm<>'PROVIDER_RESPONSE_LIMIT' then raise; end if;
   end;
  end if;
 end loop;
 assert not exists(select 1 from public.provider_responses where lead_invitation_id=invitation), 'failed charge saved a response';
 insert into public.subscription_entitlements(subject_type,subject_id,plan_code,status,qualified_leads_used,qualified_leads_limit,starts_at,ends_at)
 values('provider',provider::text,'starter_monthly','active',14,15,now()-interval '1 day',now()+interval '1 month');
 result:=public.submit_provider_response_billed(invitation,'available_next_week');
 assert result->>'chargeType'='subscription','last monthly response was not charged';
 begin
  perform public.submit_provider_response_billed(invitation,'available_now');
  raise exception 'duplicate response accepted';
 exception when others then
  if sqlerrm not in ('Opportunity is not available','Opportunity already answered') then raise; end if;
 end;
 assert (select qualified_leads_used=15 from public.subscription_entitlements where subject_id=provider::text and plan_code='starter_monthly'),'duplicate consumed allowance';

 insert into public.projects(title,customer_description,category,location_text,status,source_channel)
 values('Validation only','Rollback-only validation','plumber','Validation','matching','admin') returning id into project_id;
 insert into public.lead_invitations(project_id,provider_id,status,response_token_expires_at)
 values(project_id,provider::text,'sent',now()+interval '1 hour') returning id into invitation;
 begin
  perform public.submit_provider_response_billed(invitation,'available_today');
  raise exception 'exhausted monthly plan bypassed limit';
 exception when others then
  if sqlerrm<>'PROVIDER_RESPONSE_LIMIT' then raise; end if;
 end;
 insert into public.subscription_entitlements(subject_type,subject_id,plan_code,status,qualified_leads_used,qualified_leads_limit,starts_at)
 values('provider',provider::text,'lead_pack_4','active',3,4,now()-interval '1 day');
 result:=public.submit_provider_response_billed(invitation,'available_today');
 assert result->>'chargeType'='lead_pack','lead pack did not cover exhausted subscription';
 assert (select qualified_leads_used=4 from public.subscription_entitlements where subject_id=provider::text and plan_code='lead_pack_4'),'last lead pack credit not charged';

 insert into public.projects(title,customer_description,category,location_text,status,source_channel)
 values('Validation only','Rollback-only validation','plumber','Validation','matching','admin') returning id into project_id;
 insert into public.lead_invitations(project_id,provider_id,status,response_token_expires_at)
 values(project_id,provider::text,'sent',now()+interval '1 hour') returning id into invitation;
 result:=public.submit_provider_response_billed(invitation,'declined');
 assert result->>'chargeType'='declined','decline was charged';
 update public.projects set status='cancelled' where id=project_id;
 update public.lead_invitations set status='sent' where id=invitation;
 begin
  perform public.submit_provider_response_billed(invitation,'available_today');
  raise exception 'closed project accepted response';
 exception when others then
  if sqlerrm not in ('Opportunity already answered','Customer project is no longer accepting responses') then raise; end if;
 end;

 -- Verified recurring cycles reset once; replay must not reset the quota.
 insert into public.payment_transactions(m_payment_id,provider_id,plan_code,plan_kind,amount_cents,processor_status)
 values(payment_ref,provider,'starter_monthly','subscription',2900,'COMPLETE');
 assert public.grant_provider_payment_entitlement(payment_ref,processor_ref),'verified payment not activated';
 update public.subscription_entitlements set qualified_leads_used=2 where subject_id=provider::text and plan_code='starter_monthly';
 assert not public.grant_provider_payment_entitlement(payment_ref,processor_ref),'replayed payment activated';
 assert (select qualified_leads_used=2 from public.subscription_entitlements where subject_id=provider::text and plan_code='starter_monthly'),'replay reset quota';
 assert public.record_provider_subscription_cancellation(provider,'starter_monthly'),'cancellation not recorded';
 assert (select status='active' and ends_at>now() and metadata->>'cancel_at_period_end'='true' from public.subscription_entitlements where subject_id=provider::text and plan_code='starter_monthly'),'cancellation removed paid access';
end $$;

do $$
begin
 assert not has_table_privilege('anon','public.provider_admin_sessions','select'), 'anonymous sessions exposed';
 assert not has_table_privilege('authenticated','public.provider_admin_sessions','insert'), 'browser can create admin sessions';
 assert not has_column_privilege('authenticated','public.projects','customer_id','update'), 'browser can reassign project owner';
 assert not has_column_privilege('authenticated','public.projects','customer_access_token_hash','update'), 'browser can replace access token';
 assert not has_table_privilege('authenticated','public.projects','truncate'), 'browser retains truncate';
 assert not has_function_privilege('authenticated','public.reserve_customer_photo_image(uuid,text)','execute'), 'browser can manipulate photo accounting';
 assert not has_function_privilege('anon','public.submit_provider_response_billed(uuid,text,timestamptz,timestamptz,numeric,numeric,numeric,text,text,timestamptz)','execute'), 'anonymous billing RPC exposed';
end $$;
