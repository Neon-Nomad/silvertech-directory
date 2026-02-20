# SilverTech Master Brief

## 1. Executive Snapshot
SilverTech Directory is a senior-living platform with three connected layers:
1. Family-side discovery (search, facility detail, state/city pages, regulatory resources).
2. Operator-side workflow (signup/login, claim, dashboard, billing, plan assignment).
3. Data and SEO infrastructure (sitemaps, redirects, schema, indexing, fallback search data).

Primary business motion: organic demand acquisition -> facility/operator conversion -> recurring subscription revenue -> expansion into higher-value data products.

## 2. Product Scope (Current)
### 2.1 Family Experience
1. Search by state, city, ZIP, and facility name.
2. Facility detail pages.
3. Assisted-living state and city pages.
4. State regulatory hubs and regulation topic pages.
5. Support/guides/resources pages.

### 2.2 Operator Experience
1. Operator account signup/login.
2. Claim flow for facilities.
3. Dashboard tabs: overview, listings, leads, Q&A, billing, lineage, help.
4. Subscription-based plan upgrades.
5. Slot assignment of paid benefits across facilities.

### 2.3 Commercial Layer
1. Free-to-paid plan ladder defined in code.
2. Stripe-linked upgrade and billing portal workflows.
3. Plan entitlements tracked on profile + facility assignment state.

## 3. Technical Architecture
### 3.1 Frontend
1. React + TypeScript + Vite SPA.
2. Route-level lazy loading.
3. Helmet-managed metadata.
4. Stripe Elements loaded globally.

Core file: App.tsx

### 3.2 Backend/Data
1. Supabase (auth, DB, edge functions).
2. Typesense (primary search index).
3. Stripe (subscriptions, portal, webhooks).

### 3.3 Hybrid Rendering
1. Main app built via Vite.
2. Astro pages built separately.
3. Astro output merged into the final dist for key SEO route trees.

Files:
- stro.config.mjs
- scripts/merge_astro.mjs

## 4. Core User Flows
### 4.1 Family Search Flow
Priority order in DirectorySearch:
1. Typesense search.
2. Supabase RPC fallback.
3. Direct Supabase query fallback.
4. Offline JSON fallback.

Files:
- eatures/family/discovery/DirectorySearch.tsx
- src/utils/facilityIndex.ts

### 4.2 Claim + Operator Activation
1. User creates operator account.
2. Logs in.
3. Submits claim record with facility + contact context.
4. Claim stored in acility_claims with pending status.

Files:
- eatures/auth/OperatorSignUp.tsx
- eatures/auth/OperatorLogin.tsx
- eatures/operator/ClaimFacilityPage.tsx

### 4.3 Billing + Entitlements
1. Operator upgrades plan.
2. Billing state is tied to user_profiles.
3. Facility assignment consumes available slot count.
4. Stripe portal available for active billing users.

Files:
- eatures/operator/dashboard/BillingPlansView.tsx
- src/config/pricing.ts
- supabase/functions/create-portal-session/index.ts
- supabase/functions/create-checkout-session/index.ts
- supabase/functions/stripe-webhook/index.ts

## 5. SEO System (As Implemented)
### 5.1 Meta and Canonical
1. Most routes emit canonical URLs with eact-helmet-async.
2. Astro layout also emits canonical/OG defaults.
3. Legacy route canonicalization exists (for example, regulatory -> regulations redirect).

Files:
- App.tsx
- stro-src/layouts/Base.astro
- multiple route components under eatures/

### 5.2 Schema Markup
Implemented schema patterns include:
1. Organization and WebSite global schema.
2. SeniorLivingCommunity on facility pages.
3. BreadcrumbList on hierarchical pages.
4. FAQPage / QAPage where enabled.
5. LocalBusiness in city-oriented content.

Files:
- components/seo/GlobalSchema.tsx
- eatures/family/discovery/FacilityDetails.tsx
- eatures/family/discovery/FacilityQASchema.tsx
- eatures/regulatory/StateRegulatoryHub.tsx

### 5.3 Sitemap Pipeline
1. scripts/generate_sitemaps.ts builds static/state/city/facility sitemap sets.
2. Facility sitemap is chunked to keep file sizes manageable.
3. Master sitemap.xml indexes all sitemap groups.
4. scripts/verify_sitemap.ts enforces canonical hygiene and fails CI when non-canonical patterns appear.

### 5.4 Crawling and Delivery Controls
1. public/robots.txt allows crawl and references sitemap.
2. public/_redirects canonicalizes legacy URLs, including UUID facility URLs.
3. public/_headers adds cache policy for large JSON assets.

## 6. Performance Architecture and Current State
### 6.1 Historical Bottleneck
Offline fallback previously loaded full acilities_index.json (~7.5MB), causing heavy fallback payloads.

### 6.2 Optimization Implemented
1. State-sharded facility index support added.
2. Fallback now attempts state shard before global full index.
3. Cache headers configured for shard/full JSON files.

### 6.3 Current Perf Focus
LCP and INP are generally healthy in local checks; CLS remains the main active concern.

## 7. Data and Feature Surface
### 7.1 Feature Modules
Top-level product modules under eatures/:
1. amily
2. operator
3. locations
4. egulatory
5. esources
6. uth
7. eviews
8. public
9. seo

### 7.2 Script Toolchain
Automations include:
1. Sitemaps and redirects generation.
2. Seed ingestion and indexing scripts.
3. Pipeline monitoring/normalization scripts.
4. Stripe/product setup scripts.
5. Release/monitor gate scripts.

Directory: scripts/

## 8. Revenue Model and Path to Profit
### 8.1 Implemented Revenue Path
1. Organic SEO traffic enters via long-tail family intent pages.
2. Operators claim profiles and enter dashboard.
3. Free tier introduces surface value.
4. Paid plans sell ranking, slot volume, lead tooling, and premium visibility.

### 8.2 Growth Levers
1. Improve operator activation rate from signup to first claim.
2. Improve paid conversion from free plan.
3. Increase plan stickiness via daily-use dashboard value.
4. Increase average revenue per operator through higher tiers and add-ons.

### 8.3 End-Game Revenue Thesis
1. Directory demand capture as acquisition engine.
2. SaaS workflow layer as retention engine.
3. Data products/API layer as defensibility and margin expansion.

## 9. Key Risks and Constraints
1. Auth delivery reliability (email verification + OAuth setup gaps can block onboarding).
2. Environment/config drift across app, scripts, and edge functions.
3. Potential divergence between payment-link and function-based checkout paths.
4. Search Console recrawl latency causing delayed validation of fixes.
5. CLS and UX polish issues affecting conversion quality.

## 10. Operational Priorities (Recommended)
1. Lock auth reliability first: SMTP + OAuth + resend/reset UX.
2. Standardize billing source of truth and entitlement updates.
3. Keep sitemap and redirect canonical hygiene strict.
4. Complete CLS fixes on key templates.
5. Instrument conversion funnel metrics from signup -> claim -> paid.

## 11. Canonical File Index
- App shell and routes: App.tsx
- Search and fallback: eatures/family/discovery/DirectorySearch.tsx, src/utils/facilityIndex.ts
- Global schema: components/seo/GlobalSchema.tsx
- Facility SEO: eatures/family/discovery/FacilityDetails.tsx
- Q&A schema: eatures/family/discovery/FacilityQASchema.tsx
- Sitemaps: scripts/generate_sitemaps.ts, scripts/verify_sitemap.ts
- Robots/headers/redirects: public/robots.txt, public/_headers, public/_redirects
- Auth context: src/context/AuthProvider.tsx
- Pricing config: src/config/pricing.ts
- Billing UI: eatures/operator/dashboard/BillingPlansView.tsx
- Stripe edge functions:
  - supabase/functions/create-checkout-session/index.ts
  - supabase/functions/create-portal-session/index.ts
  - supabase/functions/stripe-webhook/index.ts

## 12. Notes
This brief describes current state from repository implementation and deployment behavior discussed during current optimization work. Keep it updated whenever routing, billing, SEO canonical logic, or onboarding flows change.
