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

## SEO and deployment URL

The canonical URL, `og:url`, `robots.txt` and `sitemap.xml` all come from one place: `lib/site-url.js`, which reads `NEXT_PUBLIC_SITE_URL` (default `https://luqmati.vercel.app`). Set it on the host so search engines see the host the app is actually served from — a canonical pointing at a domain that does not resolve removes the site from search results entirely.

To verify the site in Google Search Console, put its token in `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and redeploy; it is emitted as the `google-site-verification` meta tag. Then submit `/sitemap.xml`.

## Meal image storage (Vercel Blob)

Thumbnails go to a **private** Vercel Blob store when `BLOB_READ_WRITE_TOKEN` is set (Hobby includes 1 GB). `BLOB_STORE_ID` is optional and only needed when the token can reach more than one store.

Meals store the blob **pathname** (`meal-thumbnails/<mealId>.webp`), never a public URL. Reads go through `GET /api/meals/[mealId]/thumbnail`, which authenticates the user and checks meal ownership before streaming the bytes — a public blob URL would expose other people's photos.

Without a token (local dev, or before the store exists) the app falls back to inline data URLs so thumbnails still work, but that keeps image bytes inside Postgres; set the token in production.

## Free-tier notes

- Vercel Hobby is free for non-commercial projects.
- Neon's free tier is 0.5 GB; Vercel Blob keeps image bytes out of it.
- Clerk production instances require a domain you own with DNS records; a `*.vercel.app` host can only use a development instance.
- OpenRouter `:free` models are limited to 20 requests/minute and 50/day without purchased credit (1,000/day after the first $10). The current default model costs a fraction of a cent per analysis.
