# Luqmati

This app is a Next.js food-analysis experience with Clerk auth, Neon/Postgres persistence, and OpenRouter AI analysis.

## Environment setup

Create a `.env.local` file for local development with the required values:

```bash
DATABASE_URL=postgresql://...
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=your-vision-model
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
ADMIN_EMAILS=you@example.com,admin@example.com
```

`OPENROUTER_MODEL` is optional; when omitted, the app uses its built-in vision model fallbacks. Configure environment values in Netlify or a local `.env.local` file, not in source code. `.env.local` is ignored by Git through the `.env*` entry in `.gitignore`.

The Clerk publishable key is intended to be exposed in browser code; the `NEXT_PUBLIC_` prefix is part of Clerk's standard Next.js configuration. In Netlify, open **Site configuration → Environment variables** and add:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: the production publishable key from your Clerk production instance.
- `CLERK_SECRET_KEY`: the matching production secret key. Keep this server-side and never expose it to browser code.
- `SECRETS_SCAN_OMIT_KEYS`: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. This exempts only the intentionally public key from Netlify's secrets scanner; never omit `CLERK_SECRET_KEY` or other private credentials.

Apply the variables to the production deploy context (and any other contexts you deploy), then trigger a new deploy. `netlify.toml` also sets `SECRETS_SCAN_OMIT_KEYS`, but confirm the Site configuration value exists if scanning still blocks the deploy. The build intentionally fails if the publishable key starts with `pk_test_`; do not remove or bypass this check.

Before committing, verify `.env.local` is ignored (`git check-ignore .env.local`) and not tracked (`git ls-files .env.local` should return no result). Never commit `.env.local` or actual Clerk keys.

## Admin access

Set `ADMIN_EMAILS` to a comma-separated list of admin emails. Only users whose Clerk email matches one of these addresses can access `/admin` and see the analytics dashboard.

## Production key swap checklist

1. Copy the publishable and secret keys from the same production Clerk instance.
2. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `SECRETS_SCAN_OMIT_KEYS=NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in Netlify's production deploy context (and update local `.env.local` separately if needed).
3. Trigger a new production deploy and verify the browser no longer shows the development-key warning.

## Local development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3002` by default.

## Notes

- The app includes a global CSP, a secure admin redirect, and a non-invasive visit counter that hashes client IP + UA before storing a unique visitor hash.
- The AI route compresses images client-side before sending to OpenRouter and applies a hard timeout plus retry logic for transient failures.
