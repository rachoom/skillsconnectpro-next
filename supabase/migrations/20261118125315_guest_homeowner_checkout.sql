alter table public.customer_payment_transactions
  alter column user_id drop not null;

alter table public.customer_payment_transactions
  add column if not exists claim_token_hash text,
  add column if not exists claim_expires_at timestamptz,
  add column if not exists claimed_at timestamptz;

create unique index if not exists customer_payment_transactions_claim_token_hash_key
  on public.customer_payment_transactions (claim_token_hash)
  where claim_token_hash is not null;
