# CLAUDE.md — product-stager (KINETIC)
# Layers on top of ~/claude/CLAUDE.md. Project-specific rules win on conflict.

## What this is
AI-powered product staging tool that takes a product photo and generates
lifestyle/contextual images using Google Gemini. Single-page Next.js app,
mobile-first (430px viewport), deployed on Vercel.

## Commands
```bash
npm run dev      # dev server with hot reload
npm run build    # production build → .next/
npm start        # serve production build (run build first)
```
No test runner configured. No linter configured. If adding either, update here.

## Stack
- Next.js 15 (App Router), React 18 — no Pages Router
- Tailwind CSS 3 for utility classes; most component styles are inline via the `C` design token object in `app/page.jsx`
- Google Gemini API (`@google/genai`) — model `gemini-3-pro-image-preview`
- Vercel KV (optional) for batch state; falls back to in-memory Map in dev
- localStorage for client-side history persistence (`product-stager-history` key)

## Key paths
```
app/page.jsx          # entire UI — 1700+ lines, one big client component
app/api/generate/     # POST endpoint: accepts base64 image, returns generated image
lib/backgrounds.js    # background presets + buildPrompt() — edit here for prompt changes
lib/queue-store.js    # batch CRUD, KV + in-memory
```

## Env vars
```
GEMINI_API_KEY=       # required — Google AI Studio key
```
Copy `.env.local.example` → `.env.local` before running locally.

## Commit style
Conventional commits, no scope required:
```
feat: add iterations per product with grouped gallery view
fix: hand model accuracy, add history panel
Security: sanitize errors, add origin check + input limits  ← older style, avoid
```
Prefer lowercase `feat:` / `fix:` / `chore:` / `refactor:`.

## Branch conventions
Feature branches: `claude/<descriptor>` (matches existing pattern).
Merge via PR into `main`.

## Architecture notes
- `app/page.jsx` is intentionally monolithic — don't split unless the file meaningfully
  benefits from it; the current structure uses section-marker comments (`// ─── Name ───`)
- Design tokens live in the `C` object at the top of `page.jsx`; don't scatter color values
- `buildPrompt()` in `lib/backgrounds.js` is the single source of truth for Gemini prompts — all prompt changes go there
- Rate limiter is in-process (Map-based); resets on cold start — not suitable for multi-instance without KV

## Off-limits / be careful
- Don't touch the API key sanitization logic in `app/api/generate/route.js` without a security review
- Don't persist raw base64 images server-side — they stay client-only (state + localStorage)
- `@imgly/background-removal` is installed but intentionally unused — don't wire it up without a task for it
- Vercel KV TTL is 24h; don't increase without checking storage costs

## Project-specific overrides
- No tests exist yet — don't add a test framework without explicit ask
- Inline styles are intentional here (not a smell) — the design token system (`C`) keeps them consistent
- `'use client'` on the main page is correct; don't convert to RSC without understanding the localStorage/state dependency
