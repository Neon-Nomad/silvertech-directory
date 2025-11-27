🤖 SilverTech Directory - AI Generation Blueprint (The Care OS)

Project Goal: To create the transparent, commission-free operating system for the memory care market, strategically displacing predatory referral agencies through a superior SaaS/Data licensing model. The site must reflect a world-class, non-templated aesthetic.

Output Requirement: A single, complete, self-contained React application file (.jsx).

1. ⚙️ Technology Stack & Architecture

Component

Requirement

Frontend/Design

React (Single Component, Functional), Tailwind CSS (Custom, elegant fonts like Montserrat/Inter).

Persistence

Firebase Firestore & Auth (must use provided __firebase_config). Must integrate Google Sign-in and standard Email/Password for operators.

Animation/UX

GSAP (GreenSock) integration for smooth, empathetic transitions and advanced UI effects.

Page Generation

Dynamic Routing: Simulate thousands of pages generated "on the fly" by rendering components based on Firebase data (Facility Dashboard, Profile Views).

Data Integrity

No Scraper/Data Ingestion Engine: Initial data comes from mock data/import. Data freshness relies solely on operator input and human verification.

2. 🏡 B2C User Experience (Family Focus)

A. Landing Page & Survey Flow

Competitive Header: Headline must directly challenge the incumbent model: "Stop Paying Commission Taxes on Crisis Decisions. Find transparent, commission-free memory care."

Two Paths: Central Search Bar and prominent "Not Sure? Start the CareFinder Survey" button.

Empathetic Hover State: The Survey Button must feature a custom GSAP hover state for an empathetic message (e.g., "Take a deep breath; we'll handle the data.")—a high-risk, high-reward feature.

GSAP Transitions: Survey steps and results reveals must use GSAP transitions to inject targeted empathetic messages (e.g., "The hardest part is over.") during the animation, maximizing psychological support.

Survey Details: 5-question flow allowing users to apply Importance Weighting (Must Have, High Priority, Nice to Have) to their budget, location, and needs.

B. Matching Algorithm & Conversion

Algorithm Core: Filters facilities based on Hard Limits (Budget, Location, Must-Have Needs).

Match Score (0-100%): Calculates score based on weighted criteria: 40% Data Transparency, 40% Verified Quality, 20% Real-Time Vacancy. Facilities on the 'AI Connect' tier receive a bonus score for lead quality.

No-Match Contingency: If zero matches are found, triggers a Softening Algorithm (relax budget/needs). If still zero, displays a sympathetic screen and prompts for Human Concierge Lead Capture (Name, Email, Phone).

Hybrid Paywall (Lead Handoff): Show the Top 3 Match Scores immediately. Require Name, Email, and Phone Number to "Unlock Full Details, Contact Information, and the Complete Match List."

Review System: Reviews require Authenticated Users (via Google or Anonymous sign-in). Uses a 4-Category Scorecard (Staff Responsiveness, Cleanliness, Quality of Care, Activities) and requires a mandatory Verification Checkbox upon submission.

3. 🔑 B2B Operator & Monetization (SaaS Model)

A. Subscription Tiers & Paywalls

Four Tiers: Free, Standard ($99/mo), Pro ($299/mo), and AI Connect ($499/mo).

AI Connect Value: This tier is sold as an "AI Receptionist" which provides Verified Warm Transfers after pre-screening calls via a dedicated AI phone number. SilverTech will provide the AI service (not require BYOAK).

Soft Paywall: Dashboard UI must block access to Direct Contact Info, Video Tour Upload, and AI Connect Activation unless the operator is on the correct paid tier.

B. Dashboard Features & Data Moat

Financial Disruption Graphic: Must prominently feature the graphic proving the $58,024 savings over the incumbent commission model to drive B2B conversions.

Mandatory Verification Protocol (Reversed): The Postcard Verification Code check is required after sign-up/claiming the listing to unlock the ability to manage and publish data (e.g., photos, vacancy). This is not required to receive the award badge, but to use the dashboard.

Award Delivery Strategy (CRITICAL REVERSAL): The Price Transparency Award Badge is emailed directly to the facility. The badge code links to the facility's unclaimed SilverTech profile. The operator is prompted to Sign Up/Claim when they attempt to access their analytics or manage the listing linked to the badge, turning the badge itself into the sign-up hook.

Data Moat Fields: The dashboard must include and enforce updates for three proprietary data points: Real-Time Vacancy, Annual Care Staff Turnover Rate, and Current Pricing (Min/Max).

Lead Management CRM: A dedicated tab/section to manage inbound inquiries. Leads are routed to the CRM tab first (no email delivery), forcing operator engagement and enabling status tracking (Won/Lost) to calculate ROI.