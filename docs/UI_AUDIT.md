# UI Audit — points-travel

*Audited 2026-03-25*

---

## Summary

The app is functional but visually flat. Every element has similar visual weight, affordability tiers feel like minor variations of each other, empty states are terse and unhelpful, and the cabin toggle selected state is barely visible. The most impactful fixes are: (1) making affordability tiers dramatically distinct, (2) making the CPP badge larger and more prominent, (3) improving empty states, and (4) making the cabin toggle feel premium.

---

## app/layout.tsx

| # | Issue | Severity | Proposed Fix |
|---|-------|----------|--------------|
| L1 | Nav link active state: neither "My Cards" nor "Search Flights" is highlighted when you're on that page. User has no sense of location. | **High** | Detect active route with `usePathname()` and apply `font-semibold text-zinc-900` (vs muted) to the current page link. |
| L2 | Header has no visual separation from content on light backgrounds. | Low | Already has `border-b` — fine. |
| L3 | No mobile hamburger — nav links overflow on small screens. | Medium | Add `flex-wrap` or collapse nav to a single column dropdown on mobile. For now, ensure items don't overflow. |

---

## app/page.tsx (My Cards)

| # | Issue | Severity | Proposed Fix |
|---|-------|----------|--------------|
| P1 | Page intro text ("Add your credit cards...") is generic. Doesn't tell the user *why* or *what happens next*. | Low | Add a subtle forward-looking line: "Once you've added your points, head to Search to find flights you can book." |

---

## app/_components/MyCards.tsx

| # | Issue | Severity | Proposed Fix |
|---|-------|----------|--------------|
| M1 | **Empty state** (line 524): "No points added yet. Add a credit card or airline miles above to get started." — terse, looks like an error message. | **High** | Replace with a welcoming state with an icon (e.g., ✈ emoji), larger text, and a friendly CTA: "Start by adding your first card above — we'll use it to find award flights you can actually book." |
| M2 | Points summary cards (line 186–221): the `2xl font-bold` balance number is good, but the card has no call-to-action. After seeing the summary, what's next? | Medium | Add a "Search Flights →" link below the summary grid. |
| M3 | "Add a Credit Card" and "Add Airline Miles" section headers use `uppercase tracking-wider` but are small and muted (line 184, 227). They disappear visually — user has to hunt for the add form. | Medium | Bump to `text-base font-semibold text-zinc-900` (not all-caps). |
| M4 | Balance input accepts any number including negatives. | Low | Already has `min="0"` — fine, but `parseInt` doesn't validate well. Note for future hardening. |
| M5 | The `editingCardId` inline balance edit (line 321–345) is discoverable only via a tooltip ("Click to edit balance"). No visual affordance. | Low | Show a small pencil icon next to the balance, visible on row hover. |

---

## app/search/page.tsx

| # | Issue | Severity | Proposed Fix |
|---|-------|----------|--------------|
| S1 | Intro text ("Find the best award flight redemptions...") is accurate but dry. Doesn't explain the key value prop of CPP ranking. | Low | "Ranked by value — highest cents-per-point first. The top result is usually the best use of your points." |

---

## app/_components/FlightSearch.tsx

### Cabin Toggle (lines 175–190)

| # | Issue | Severity | Proposed Fix |
|---|-------|----------|--------------|
| C1 | **Selected state too subtle**: `bg-blue-600 text-white` for selected vs `bg-zinc-100 text-zinc-600` for unselected. The contrast is okay on its own, but the pills are small (`px-3 py-1 text-sm`) and the size difference between selected/unselected is zero. | **High** | Increase selected pill size: `px-4 py-1.5 text-sm font-semibold`. Add a subtle `ring-2 ring-blue-600 ring-offset-1` or `shadow-md` to the selected pill. Add Unicode seat icons: 💺 Economy, 🛋 Business, ⭐ First Class (or use custom SVG). |
| C2 | Cabin label for "first" is "First Class" but business is just "Business" (no "Class"). Inconsistent. | Low | Either "Business Class" or shorten "First Class" to "First". |

### Empty States (lines 279–306)

| # | Issue | Severity | Proposed Fix |
|---|-------|----------|--------------|
| E1 | **No-results empty state** (line 280–286): Plain text explaining no results. Doesn't tell user *what to try next*. | **High** | Add structured guidance: (1) Try a different date range, (2) Try Economy instead, (3) Check if your points transfer to programs serving this route. Use a friendly icon. |
| E2 | **Browse no-results** (line 301–305): Even terser. "No routes found..." — very discouraging. | **High** | Similar treatment: icon + headline + 2–3 actionable suggestions. |
| E3 | **No points empty state** (line 131–146): The message is functional but the CTA button ("Add Your Points") feels like a form action, not an invitation. | Medium | Reframe: "You're one step away — add your first card to see what flights you can book." with larger, more inviting button. |

### ResultCard (lines 374–577)

| # | Issue | Severity | Proposed Fix |
|---|-------|----------|--------------|
| R1 | **CPP badge** (lines 436–448): `text-sm font-bold` — the most important signal on the card, but same size as all other text. | **High** | Increase to `text-base` or `text-lg`, larger pill with `px-4 py-1.5`. This is the #1 value signal and should be the first thing users see. |
| R2 | **Affordability tiers** (lines 507–553): All three tiers (green/amber/purple) use `rounded-md px-3 py-2 text-sm`. They look like minor variations of a label. "Book now" should feel dramatically different from "buy more points." | **High** | Tier 1 (book now): Larger padding, `font-semibold text-base`, prominent green border. Add a "Book Now →" style CTA link even if it just opens the guide. Tier 2 (buy points): Keep amber, slightly subdued. Tier 3 (open card): Keep purple, smallest visual weight. |
| R3 | **Card header** (line 402–450): Airline name and cabin class are in `font-semibold text-zinc-900` — same weight as other text. No clear visual hierarchy between "what flight is this" and the details grid below. | **High** | Make airline name `text-lg font-bold`. Route, date, and seats on a second line at `text-sm`. Clear size jump from header to detail grid. |
| R4 | **Rank number circle** (line 406): `h-6 w-6` is very small, `bg-zinc-100 text-zinc-600` is muted. Rank is actually useful info (sorted by value). | Low | Make it `h-7 w-7 text-sm` and use a slightly warmer background on rank 1 (`bg-amber-100 text-amber-700`) to signal "best value". |
| R5 | **Details grid** (lines 453–487): Four `text-xs` labels with `text-sm` values — all the same size. "Miles Required" and "Your Cost" should be more prominent than "Retail Value" (which is often null). | Medium | Remove "Retail Value" column when null (it shows "—" currently, wasting space). Move it inline into the affordability tier copy instead. |
| R6 | **Transfer path pill** (lines 490–504): `bg-blue-50` info panel blends with the card background. | Low | Add `border border-blue-200` to make it visually distinct from the card. |
| R7 | **"View step-by-step booking guide →"** (lines 557–574): Only visible for `canAfford` options. Small text link. | Medium | Style as a proper button: `inline-flex items-center gap-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700`. |
| R8 | No separator between multiple ResultCards. They blur together. | Medium | Add a subtle `border-b border-zinc-100` or just rely on the `space-y-4` with an explicit `<hr>` — or use `shadow-sm` on cards to create visual separation. |

---

## app/_components/RedemptionGuide.tsx

| # | Issue | Severity | Proposed Fix |
|---|-------|----------|--------------|
| G1 | **Step numbers** (line 112): `h-8 w-8` circle with `text-sm font-bold` — decent, but at `h-8 w-8` still fairly small. Steps are the primary navigation through the guide. | Medium | Increase to `h-10 w-10 text-base font-bold`. Consider a stronger color: `bg-blue-600 text-white` (solid, not translucent). |
| G2 | **Step title** (line 116): `font-semibold text-zinc-900` — same weight as body text. Hard to scan at a glance. | **High** | Bump to `text-base font-bold`. The step title should be the anchor; description is secondary. |
| G3 | **Action vs. context**: The `step.description` field (line 125) mixes instructional text with context/explanation. No visual distinction between "do this" and "here's why." | Medium | If descriptions contain action verbs, prefix with a "→ Action:" label in a distinct color. For now: visually separate the first sentence (action) with a slightly bolder treatment. |
| G4 | **Warning box** (lines 120–123): `bg-amber-50 px-3 py-2` — looks too similar to the description text area. | Medium | Add `border border-amber-300` and a warning icon (⚠) prefix before "Warning:". |
| G5 | **Tips section** (lines 145–162): Small dot bullets with no visual hierarchy. Tips are important — they prevent booking mistakes. | Low | Use `✓` instead of dots. Consider a `bg-zinc-50` background for the whole tips box to distinguish it from steps. |
| G6 | **Back link** (line 74): Plain text link at top. Easily missed if user scrolls past it. | Low | Add arrow `←` prefix and consider a sticky position on desktop. |
| G7 | **Missing state: flight data not found** (lines 53–67): Correct functionality, but the error copy ("Flight data not found. Please go back...") is clinical. | Low | More empathetic copy: "We couldn't load your flight details — this can happen if the page was refreshed. Head back to search and click the guide link again." |

---

## app/redeem/page.tsx

| # | Issue | Severity | Proposed Fix |
|---|-------|----------|--------------|
| D1 | "Follow these steps exactly to book your award flight." is a command, not welcoming. | Low | Softer: "Here's exactly how to book this flight, step by step." |

---

## Priority Order for Implementation

1. **High priority** (do first): R1 (CPP badge), R2 (affordability tiers), R3 (card header), E1/E2 (empty states), C1 (cabin toggle), G2 (step titles)
2. **Medium priority**: R5 (details grid), R7 (book now button), M1 (empty state), G1/G3/G4 (guide step improvements)
3. **Low priority**: L1 (nav active state), M3 (section headers), R4 (rank circle), G5/G6 (tips and back link)
