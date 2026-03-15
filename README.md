# SilverTech Directory

SilverTech Directory is a senior living directory built around clean SEO routes, facility detail pages, operator tooling, and Supabase-backed data pipelines.

The public site uses a hybrid build:
- Vite/React powers the application shell and interactive flows
- Astro generates SEO-heavy route families and static content
- the final deploy artifact is merged into `dist`

## Stack

- React 18 + Vite
- Astro 5
- TypeScript
- Supabase
- Tailwind CSS
- Vitest + Playwright
- Vercel deployment

## Public route model

- `/{care-type}`
- `/{care-type}/{state}`
- `/{care-type}/{state}/{city}`
- `/community/{public_slug}-{public_route_id}`
- `/regulations`
- `/regulations/{state}`
- `/regulations/{state}/{topic}`

Legacy public directory URLs are retired rather than redirected.

## Main directories

- `App.tsx`: top-level React routing
- `features/`: product and page features
- `components/`: shared UI and layout
- `astro-src/`: Astro pages, SEO templates, and static route generation
- `src/`: shared client utilities, data access, config, and hooks
- `scripts/`: ingestion, sitemap, redirect, monitoring, and operational scripts
- `supabase/`: schema and migrations
- `tests/`: contract, unit, and integration coverage

## Local development

Requirements:
- Node.js 18+
- npm

Install and run:

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run lint
npm run build
npm run build:hybrid
npm run test:unit
npm run test:integration
npm run sitemap
npm run sitemap:verify
npm run redirects
```

Notes:
- `npm run build` builds the React app
- `npm run build:hybrid` builds React and Astro, then merges the output into `dist`
- `npm run lint` is the repo lint gate and includes strict TypeScript checks for app, Astro, and edge code

## Environment

Minimum app variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Common optional variables:

```env
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_PASSWORD=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_TYPESENSE_HOST=
VITE_TYPESENSE_PORT=
VITE_TYPESENSE_PROTOCOL=
VITE_TYPESENSE_API_KEY=
VITE_ENABLE_E2E_ROUTES=
VITE_ALERT_WEBHOOK_URL=
BUILD_TIME=
```

Notes:
- many data and admin scripts require `SUPABASE_SERVICE_ROLE_KEY`
- SQL runner and some import scripts also require `SUPABASE_DB_PASSWORD`
- Typesense variables are only needed if search is configured

## Deployment

Deployment target is Vercel.

Recommended settings:
- Build command: `npm run build:hybrid`
- Output directory: `dist`

Set the required environment variables in the Vercel project before deploying.

## Data and SEO operations

Common operational tasks:

```bash
npm run sitemap
npm run sitemap:verify
npm run redirects
npm run sql:run -- supabase/migrations/<migration>.sql
```

If you are changing public URLs, canonicals, breadcrumbs, or sitemap logic, verify the generated output before shipping.
