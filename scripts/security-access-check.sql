begin;

do $$ begin
 if has_column_privilege('anon','public.artisans','phone','select') then raise exception 'Phone exposed'; end if;
 if has_column_privilege('anon','public.artisans','email','select') then raise exception 'Email exposed'; end if;
 if not has_column_privilege('anon','public.artisans','id','select') then raise exception 'Directory unavailable'; end if;
 if has_table_privilege('anon','public.artisans','insert,update,delete,truncate') then raise exception 'Public write access remains'; end if;
 if has_table_privilege('authenticated','public.artisans','truncate') then raise exception 'Authenticated truncate access remains'; end if;
 if has_table_privilege('anon','public.contact_messages','select') then raise exception 'Contacts exposed'; end if;
 if has_table_privilege('anon','public.search_requests','select') then raise exception 'Search requests exposed'; end if;
 if has_function_privilege('anon','public.consume_public_request_limit(text,text,integer,integer)','execute') then raise exception 'Public rate-limit bypass'; end if;
 if not public.consume_public_request_limit('audit_probe',repeat('0',64),2,3600) then raise exception 'First request blocked'; end if;
 if not public.consume_public_request_limit('audit_probe',repeat('0',64),2,3600) then raise exception 'Second request blocked'; end if;
 if public.consume_public_request_limit('audit_probe',repeat('0',64),2,3600) then raise exception 'Rate cap bypassed'; end if;
end $$;
rollback;
