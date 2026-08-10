# Applying Supabase migrations securely

The repository includes a manual GitHub Actions workflow at:

```text
.github/workflows/supabase-migrations.yml
```

This avoids sharing Supabase credentials in chat or committing them to the repository.

## Required GitHub Actions secrets

In the GitHub repository, open **Settings → Secrets and variables → Actions** and add:

- `SUPABASE_ACCESS_TOKEN` — a Supabase personal access token.
- `SUPABASE_DB_PASSWORD` — the database password for the project.
- `SUPABASE_PROJECT_ID` — the Supabase project reference.

Do not use the anonymous API key or service-role key as the CLI access token.

## Review pending migrations

1. Open **Actions** in GitHub.
2. Select **Supabase migrations**.
3. Choose **Run workflow**.
4. Leave **Apply pending migrations** disabled.
5. Run the workflow.

The workflow always executes `supabase db push --dry-run` first.

## Apply pending migrations

After reviewing the dry-run output:

1. Run the same workflow again.
2. Enable **Apply pending migrations**.
3. The workflow will execute `supabase db push --yes` only after the dry run succeeds.

## Direct SQL Editor alternative

The same migrations may be copied into Supabase SQL Editor and executed manually in filename order:

1. `202608030001_marketplace_foundation.sql`
2. `202608030002_secure_access_tokens.sql`

For a one-off first deployment, SQL Editor is acceptable. GitHub Actions becomes preferable afterward because migration history remains versioned with application code.

## Separation of credentials

- `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` are used only by migration tooling.
- `SUPABASE_SERVICE_ROLE_KEY` is used only by server-side application routes at runtime.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is browser-safe but limited by RLS.

Never expose a database password, access token, or service-role key through a `NEXT_PUBLIC_` environment variable.
