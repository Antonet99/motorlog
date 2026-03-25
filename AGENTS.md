# Motorlog Context Handoff

## Project Purpose
`Motorlog` is a personal vehicle cost tracker web app.
It is used to manage vehicles, refuels, and other car or motorcycle expenses in one place.
The product should stay intentionally simple and lightweight.

## Product Constraints
- Keep the project minimal and easy to maintain.
- Avoid over-engineering, unnecessary abstractions, extra folders, or enterprise-style patterns.
- Preserve the visual identity described in this file unless explicitly asked to redesign.
- The app is for few users only.
- UX must stay mobile-first, especially on iPhone.
- Use dark surfaces, strong contrast, and a restrained accent palette.
- Prefer clarity and speed over feature breadth.

## Visual Direction
- Primary accent: electric blue.
- Supporting accents:
  - green for refuels / positive metrics
  - amber or coral for costs / warnings
  - neutral gray for passive UI
- Avoid glossy, heavy, or noisy visuals.
- Keep cards, tabs, modal flows, and floating actions compact and readable.

## Visual Language
The app should feel like a focused personal tracker, not like a corporate dashboard.

Core visual principles:
- dark UI first
- dense but readable information
- rounded cards and pills
- strong spacing rhythm
- a limited number of accent colors with clear meaning
- immediate scannability on mobile

Color behavior:
- background should be very dark charcoal, not pure black
- surfaces should use slightly lighter dark tones to create depth
- borders should be subtle, low-contrast, and used sparingly
- electric blue is the main product accent
- green is reserved for refuels, positive values, and confirmed states
- amber/coral is reserved for spending, alerts, and high-cost signals
- neutral grays are for labels, dividers, helper text, and inactive controls

Typography:
- use a clean, modern sans serif
- headings should be bold and large enough to anchor the screen immediately
- body text should stay compact and highly legible
- helper text should be smaller and dimmer, but never too faint to read on iPhone
- avoid decorative typography and oversized marketing-style headlines except on the auth screen if needed

Icons:
- use `lucide-react`
- icons should be simple line icons, consistent across the app
- every major section and action should have a stable icon
- icons should support the text, not replace it
- avoid mixing filled and outline icon styles randomly

## Layout and UI Structure
The application shell should follow this structure:
- sticky top header with app name and top-level actions
- main scrollable content area
- bottom navigation bar fixed or sticky on mobile
- floating action button in the lower-right corner, above the bottom navigation

Top header:
- left side: app name or current section title
- right side: compact utility actions when needed
- header must respect iPhone safe areas in browser and home-screen mode
- do not let content collide with the dynamic island or status bar

Bottom navigation:
- primary navigation items should be:
  - `Riepilogo`
  - `Veicoli`
  - `Rifornimenti`
  - `Spese`
- each tab should have icon + label
- active tab should be obvious through accent color and background treatment
- the bar should feel compact and slightly elevated, not oversized

Screen composition:
- each screen should start with a clear title or primary summary card
- filters, if present, should be compact and not consume excessive vertical space
- cards should stack vertically with consistent gap spacing
- avoid multi-column layouts on mobile except small pill grids or short stat rows

## Core UI Components
Cards:
- cards are the main content container
- use rounded corners, dark surfaces, subtle borders, and modest internal padding
- each card should have a clear visual hierarchy:
  - label / badge
  - primary content
  - secondary metadata
  - actions
- avoid stuffing too many visual treatments into one card

Badges and pills:
- use pills for vehicle type, fuel type, expense category, selected filters, or vehicle linkage
- pills should be compact and color-coded only when the meaning is clear
- do not create too many competing pill colors in the same area

Buttons:
- primary buttons should be high-contrast and clearly tappable
- secondary buttons should use outlined or muted dark styles
- destructive actions should be visually distinct but not screaming
- touch targets must remain comfortable on iPhone

Inputs:
- use large dark inputs with clear borders and left-aligned icons when useful
- placeholders should be readable but visually subdued
- labels should sit above the field, not inside as the only form of context
- grouped selectors can use horizontal pill buttons or compact cards

Lists:
- list items should be card-based, not plain table rows
- each row/card should be understandable in one glance
- timestamps, price, liters, km, and vehicle reference must be aligned consistently

## Modal and Entry Flows
Create/edit flows should happen inside full-screen or near-full-screen mobile modals.

Rules:
- modal opens from the floating `+` action or from edit buttons
- modal header should always have a clear title and close control
- modal body should scroll independently if needed
- footer actions should stay easy to reach on mobile
- modal layout must respect top and bottom safe areas

Quick-add pattern:
- tapping the floating `+` should expand a small quick-action menu
- quick actions should be:
  - `Veicolo`
  - `Rifornimento`
  - `Spesa`
- the quick menu should use blur, soft animation, and large enough labels/icons
- once the user picks an action, the modal should open already locked on that entity type
- do not show irrelevant tabs once the user has already chosen the entry type

Form behavior:
- keep forms short and vertically logical
- put the most important fields first
- keep optional fields later in the flow
- helper text should be short and only used when it reduces mistakes

## Vehicle Card Language
Vehicle cards should feel like the anchor objects of the app.

Each vehicle card should usually show:
- main vehicle name
- optional nickname or subtitle
- fuel type / powertrain pill
- small metadata such as plate, year, color, or number of related records

Vehicle cards should:
- be compact but visually strong
- feel more premium than plain form rows
- avoid fake skeuomorphic car-dashboard visuals
- remain readable even with long model names

## Refuel and Expense Card Language
Refuel cards:
- should quickly show liters, total cost, price per liter, odometer, date
- linked vehicle should be visible immediately
- `full tank` should be visually identifiable but not dominant
- emphasize the values the user is most likely to compare between entries

Expense cards:
- should quickly show amount, category, linked vehicle, and date
- category should be visually clear through badge/pill treatment
- notes should stay secondary and collapsed visually unless important

## Dashboard Style
The overview screen should not feel like a financial terminal.

It should contain:
- 2 to 4 compact summary cards at the top
- one or two simple charts only when they add value
- recent activity or latest refuel summary
- strong prioritization of the most useful information

Avoid:
- too many tiny metrics
- crowded legend-heavy charts
- analytics that require explanation to understand

## Motion and Interaction
- use subtle transitions for opening modals, expanding menus, and switching states
- motion should clarify hierarchy, not decorate the UI
- avoid slow or flashy animations
- toast feedback should be brief and unobtrusive
- deletion should prefer toast + undo over blocking browser dialogs when practical

## Mobile and Safe-Area Rules
- design for iPhone first
- always account for `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`
- test both in Safari and when added to the iPhone home screen
- sticky headers, bottom nav, modal footers, and FAB must never overlap unsafe areas
- long text must wrap cleanly without breaking layout
- filters and pills must degrade gracefully on narrow screens

## Stack
- Frontend: `React 19`, `TypeScript`, `Vite`
- Styling: `Tailwind CSS`
- Icons: `lucide-react`
- Charts: `recharts`
- Date utilities: `date-fns`
- Import/export: `xlsx`
- Backend/runtime services: `Firebase Auth`, `Cloud Firestore`, `Firebase Hosting`
- Optional later: `Firebase Storage` only if logo upload becomes necessary
- No custom backend server is used

## Firebase Setup
- Auth provider: Google Sign-In
- Database: Firestore `(default)`
- Hosting: Firebase Hosting
- Firestore path structure:
  - `users/{uid}/vehicles/{vehicleId}`
  - `users/{uid}/refuels/{refuelId}`
  - `users/{uid}/expenses/{expenseId}`

## Access Control
- The app is intentionally restricted to a single Google account in the starting phase.
- Access must be enforced in two places:
  - frontend auth guard
  - Firestore security rules
- If any other account logs in, it must be signed out immediately and must not be able to read or write data.
- The URL can be public, but real app usage and data access are private.

## Core Domain
Main entities:
- `Vehicle`
- `Refuel`
- `Expense`

Supported vehicle types in v1:
- `Auto`
- `Moto`

Suggested fuel / powertrain values in v1:
- `Benzina`
- `Diesel`
- `GPL`
- `Metano`
- `Ibrido benzina`
- `Ibrido diesel`
- `Elettrico`

Suggested expense categories in v1:
- `Rata`
- `Assicurazione`
- `Bollo`
- `Revisione`
- `Tagliando`
- `Meccanico`
- `Pedaggio`
- `Parcheggio`
- `Multa`
- `Lavaggio`
- `Accessori`
- `Altro`

## Data Model Guidelines
### Vehicle
Fields:
- `id`
- `uid`
- `name`
- `nickname`
- `vehicle_type`
- `brand`
- `model`
- `plate`
- `year`
- `color`
- `tank_capacity_liters`
- `fuel_type`
- `logo_url` or `logo_path` only when actually supported
- `is_active`
- `created_at`
- `updated_at`

### Refuel
Fields:
- `id`
- `uid`
- `vehicle_id`
- `timestamp`
- `liters`
- `total_cost`
- `price_per_liter`
- `odometer_km`
- `is_full_tank`
- `station`
- `notes`

### Expense
Fields:
- `id`
- `uid`
- `vehicle_id`
- `timestamp`
- `category`
- `amount`
- `notes`
- `is_recurring`

## Consumption Rules
- Show fuel consumption in `km/L`.
- Do not invent complex backend calculations.
- Compute metrics client-side from stored refuels.
- Treat `full tank` as the quality flag for accurate calculations.
- A reliable `km/L` series should only be produced when the interval can be trusted.
- If data is insufficient, prefer showing `--` or a short explanation rather than fake precision.

## Repo Structure
- `src/App.tsx`
  Main app shell: auth state, active tab, theme, toast, modal open/close
- `src/components/AuthScreen.tsx`
  Login screen
- `src/components/AddEntryModal.tsx`
  Create/edit vehicle, refuel, or expense modal
- `src/sections/OverviewSection.tsx`
  Intro dashboard / summary
- `src/sections/VehiclesSection.tsx`
  Vehicle list and vehicle details
- `src/sections/RefuelsSection.tsx`
  Refuel history and related metrics
- `src/sections/ExpensesSection.tsx`
  Other expenses by category / vehicle
- `src/sections/DashboardSection.tsx`
  Charts and deeper statistics if needed
- `src/lib/firebase.ts`
  Firebase init, auth helpers, access restriction constants
- `src/lib/data.ts`
  Firestore CRUD, subscriptions, import/export, analytics helpers
- `src/types/domain.ts`
  Domain types source of truth
- `src/index.css`
  Global styling, transitions, mobile-safe background behavior
- `public/`
  App icons, manifest, PWA assets
- `.github/workflows/firebase-deploy.yml`
  CI/CD workflow

## Development Workflow
Preferred workflow:
1. work locally on a branch
2. run local checks
3. deploy to Firebase preview
4. test from phone/browser
5. push branch to GitHub
6. open PR to `main`
7. merge on GitHub
8. let CI deploy to live

Do not use live/stable as a testing environment.

## Local Commands
- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run preview:deploy`

`preview:deploy` is important:
- it builds locally
- deploys to a stable Firebase preview channel
- it is the preferred way to test branch changes on iPhone before pushing to `main`

## Preview and Stable Environments
### Preview
Used for validation before merge.
Current preferred flow:
- local preview deploy: `npm run preview:deploy`
- PR preview deploy: automatic through GitHub Actions on PRs to `main`

### Stable
Stable is `main`.
Any push to `main` triggers production deploy to Firebase Hosting and Firestore rules.

## Git / GitHub Conventions
- GitHub repo should be private
- Stable branch: `main`
- Working branches should use `codex/` prefix
- Do not push features directly to `main`
- Preferred flow is branch -> PR -> merge -> auto deploy
- Review and merge should happen on GitHub, not by bypassing the PR flow locally

## CI/CD
GitHub Actions should:
- on `pull_request` to `main`
  - install deps
  - build app
  - deploy PR preview channel `pr-<number>`
- on `push` to `main`
  - install deps
  - build app
  - deploy Firebase Hosting live
  - deploy Firestore rules

GitHub repo variables should supply:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`

GitHub secret used:
- `FIREBASE_TOKEN`

## Important Practical Notes
- `.env.local` should exist locally and stay gitignored
- also commit `.env.local.example`
- Firebase config must come from Vite env vars, not hardcoded values
- keep the app visually coherent with the visual language defined above
- reuse the same modal and card patterns when possible
- keep state local and simple; do not introduce a state library unless there is a real problem
- only add Firebase Storage if logo upload is actually implemented
- if logo upload is deferred, keep a placeholder field or omit it entirely rather than half-implementing it

## What To Avoid
- No new backend server unless absolutely necessary
- No Supabase / hybrid auth-db experiments unless explicitly requested
- No redesign-by-default
- No folder explosion
- No unnecessary state libraries
- No weakening of auth or Firestore rules
- No changes that break the `local -> preview -> PR -> main -> stable` flow
- No attempt to solve every possible fleet-management use case

## Current Working Philosophy
This codebase should stay intentionally pragmatic:
- simple app
- clear file ownership
- Firebase handles persistence/auth/hosting
- preview first, production later
- minimal surface area
- changes should stay readable and reversible
