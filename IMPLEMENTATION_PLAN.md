# Motorlog Implementation Plan

## Goal
Build a lightweight personal vehicle-cost tracker using the same technical and workflow base as Mealbook.
The first useful version should feel complete quickly, then grow in small safe steps.

## Phase 0 - Foundation
Deliver the base repo and infrastructure before any real feature work.

Scope:
- Vite + React + TypeScript + Tailwind project setup
- Firebase Auth with Google Sign-In
- Firestore + Hosting wired through env vars
- single-user access restriction in frontend and Firestore rules
- dark mobile-first shell
- bottom navigation scaffold
- floating `+` action scaffold
- preview deploy script
- GitHub Actions for PR preview and `main` live deploy
- `.env.local.example`
- `AGENTS.md`

Done when:
- login works
- unauthorized Google accounts are rejected
- preview deploy works on phone
- push to `main` deploys live

## Phase 1 - Vehicles
Build the minimum structure that lets the app feel real.

Scope:
- create, edit, delete vehicles
- support only `Auto` and `Moto`
- fields:
  - brand
  - model
  - nickname
  - plate
  - year
  - color
  - tank capacity
  - fuel type / powertrain
- vehicle list cards
- default active vehicle selection

Intentionally defer:
- logo upload
- advanced specs
- image cropping

Done when:
- at least one vehicle can be created and edited
- vehicles are readable in a compact mobile list
- every next entity can link back to a vehicle

## Phase 2 - Refuels
This is the first high-value tracking flow.

Scope:
- add, edit, delete refuels
- fields:
  - linked vehicle
  - liters
  - total cost
  - price per liter
  - odometer km
  - date
  - full tank toggle
  - optional station
  - optional notes
- refuel history screen
- sort by most recent first
- small vehicle summary chip inside each refuel record

Done when:
- a user can build a reliable chronological refuel history
- records are easy to scan on mobile

## Phase 3 - Basic Metrics
Use the refuel data to make the app useful immediately.

Scope:
- last refuel summary
- total spend for selected period
- average price per liter
- rough consumption preview in `km/L`
- consumption only when data is trustworthy enough
- graceful fallback when data is incomplete

Recommended rule:
- treat `full tank` as the anchor for more credible `km/L` calculations
- do not fake accuracy if a partial refuel breaks the chain

Done when:
- the app already gives value even with just vehicles + refuels

## Phase 4 - Other Expenses
Add the second main money flow without making the app heavy.

Scope:
- add, edit, delete generic expenses
- categories:
  - rata
  - assicurazione
  - bollo
  - revisione
  - tagliando
  - meccanico
  - pedaggio
  - parcheggio
  - multa
  - lavaggio
  - accessori
  - altro
- fields:
  - linked vehicle
  - category
  - amount
  - date
  - optional notes
- expense history screen
- filters by vehicle and category

Done when:
- all non-refuel car costs can be logged quickly

## Phase 5 - Overview Dashboard
Only after the core data flows work well.

Scope:
- intro overview screen on app open
- cards such as:
  - latest refuel
  - current month total spend
  - spend split: refuels vs other expenses
  - active vehicle quick summary
  - recent activity
- one simple chart at first, not a full analytics suite

Done when:
- the app answers basic questions immediately after opening

## Phase 6 - Quick Add and UX Refinement
Port the best interaction patterns from Mealbook.

Scope:
- floating `+` button in bottom-right
- expandable quick-add menu with:
  - `Veicolo`
  - `Rifornimento`
  - `Spesa`
- blur background
- opening animation
- open modal already locked on chosen type
- mobile-safe modal behavior
- toast + undo for deletions

Done when:
- common actions are fast enough from one thumb on iPhone

## Phase 7 - Better Filters and Browsing
Improve daily use before adding complexity.

Scope:
- date filters:
  - oggi
  - 7 giorni
  - 30 giorni
  - intervallo custom
- filters by vehicle
- filters by entry type
- grouping by day in histories
- sticky compact filter card

Done when:
- the user can find records quickly without feeling the app is cluttered

## Phase 8 - Vehicle Detail Value
Make each vehicle feel like a useful object, not just a label.

Scope:
- per-vehicle summary
- latest refuel
- latest expense
- period spend
- average fuel price
- last known odometer

Optional here:
- manual active/inactive vehicles
- archive instead of hard delete

## Phase 9 - Optional Logo Upload
Only if the rest already feels solid.

Scope:
- Firebase Storage integration
- vehicle logo upload
- safe URL persistence in Firestore
- graceful fallback if no logo exists

Why this is late:
- it adds storage, upload UX, and cleanup complexity
- it is visually nice but not core to value

## Phase 10 - Export / Backup
Useful, but only after the app proves itself.

Scope:
- export vehicles, refuels, expenses to XLSX
- import path only if really needed
- schema versioning

## Recommended Order For Real Development
1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 4
6. Phase 5
7. Phase 6
8. Phase 7
9. Phase 8
10. Phase 9
11. Phase 10

## Key Product Decisions
- Keep separate collections for `vehicles`, `refuels`, and `expenses`.
- Link refuels and expenses to vehicles by `vehicle_id`.
- Compute analytics client-side.
- Avoid a custom backend.
- Prefer fast manual entry over overloaded forms.
- Defer anything image-heavy or rarely used until later.

## What To Test On Preview Every Time
- iPhone safe areas
- modal layout on small screens
- auth lock to the single account
- create/edit/delete flows
- filters and sorting
- quick-add interactions
- persistence after refresh
