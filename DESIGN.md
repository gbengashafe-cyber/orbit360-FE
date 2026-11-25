# Orbit 360 Design System

**Status:** approved 25 Nov 2026. This is the single source of truth for how Orbit 360 looks and behaves.
Everyone working on `orbit360-FE` (people and AI agents) follows it for new work and for any screen they touch.

- Visual reference with live examples: [`docs/design/design-system-proposal.html`](docs/design/design-system-proposal.html) (open it in a browser).
- Implementation status: **step 1 is built** (tokens, restyled shadcn components, shared components, Sonner toasts). Pages are migrated in steps 2–4; until a page is migrated it may still show old gradients and icon tiles. Never add new ones.
- Live reference in the running app: `/design-system` (development builds only; it renders the real components).

### Where things live

| Need                                                                                                                                      | Use                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Buttons, inputs, select, dropdown menu, dialog, sheet, popover, calendar, table, tabs, tooltip, badge, card                               | `@/components/ui/*` (restyled shadcn)                                                                                                                                                  |
| Page header, status badge, table shell + pagination, row ⋯ menu, empty state, stat card, form section/field, confirm dialog, date pickers | `@/components/system`                                                                                                                                                                  |
| Date and money formatting (`formatDate`, `formatDateRange`, `formatDateTime`, `formatCurrency`, `countWorkingDays`)                       | `@/components/system`                                                                                                                                                                  |
| Toasts                                                                                                                                    | `toast` from `sonner` (`toast.success`, `toast.error`, `toast.info`, `toast.warning` for the pending tone, `toast()` for neutral)                                                      |
| Colours                                                                                                                                   | Tailwind tokens: `bg-primary`, `text-muted-foreground`, `border-border`, `bg-brand-50`, `text-status-danger`, `bg-status-success-bg`, … (`gray-*`/`slate-*` map to the Orbit neutrals) |
| Type scale                                                                                                                                | `text-page-title`, `text-section-title`, `text-card-title`, `text-body`, `text-label`, `text-caption`                                                                                  |
| Floating surfaces                                                                                                                         | `shadow-overlay` (the only shadow)                                                                                                                                                     |

---

## 1. Principles

1. **Quiet by default.** White and grey do most of the work. Borders separate things; shadows only lift things that float (menus, popovers, dialogs, toasts).
2. **One accent, used on purpose.** Brand blue marks the one primary action, the active page, links and focus. Nothing else.
3. **Icons earn their place.** An icon stays only if it helps someone find or recognise something faster.
4. **One status language.** Every module uses the same five status tones and plain-English labels.
5. **Dense, readable data.** 14px text, compact rows, right-aligned money in tabular figures.

## 2. Colour

### Brand

| Token       | Hex       | Use                                                            |
| ----------- | --------- | -------------------------------------------------------------- |
| `brand-600` | `#1A66E3` | Primary buttons, active nav, links, focus ring (from the logo) |
| `brand-700` | `#1553BD` | Hover / pressed                                                |
| `brand-100` | `#DCE8FC` | Focus ring halo, selected row                                  |
| `brand-50`  | `#EEF4FE` | Active nav background, selected range in calendars             |
| `indigo`    | `#14069A` | Logo and charts only                                           |

### Neutrals (slightly blue-biased)

| Token      | Hex       | Use                           |
| ---------- | --------- | ----------------------------- |
| `gray-0`   | `#FFFFFF` | Cards, inputs, popovers       |
| `gray-50`  | `#F6F8FB` | Page background, table header |
| `gray-100` | `#EEF1F6` | Hover, table row dividers     |
| `gray-200` | `#E2E7EF` | Borders                       |
| `gray-300` | `#CBD3DF` | Input borders                 |
| `gray-500` | `#6B7689` | Secondary text, captions      |
| `gray-700` | `#363F4F` | Labels                        |
| `gray-900` | `#141A26` | Body text, headings           |

### Status tones

| Tone      | Text      | Background | Border    | Meaning                                    |
| --------- | --------- | ---------- | --------- | ------------------------------------------ |
| `pending` | `#8A5300` | `#FFF4DE`  | `#F2D49A` | Waiting for someone                        |
| `info`    | `#1553BD` | `#EEF4FE`  | `#C9DBFA` | In progress, active                        |
| `success` | `#157347` | `#E8F6EE`  | `#BFE5CF` | Approved, completed                        |
| `danger`  | `#B42318` | `#FDECEA`  | `#F5C2BD` | Rejected, errors (solid button: `#D92D20`) |
| `neutral` | `#4D5769` | `#EEF1F6`  | `#D7DDE7` | Cancelled, draft                           |

### Colour rules

- **Do:** brand blue for the main action, active nav, links and focus; status tones only for status, alerts, validation and toasts; everything else neutral.
- **Don't:** gradients anywhere (`bg-gradient-*`), a different colour per stat card or module, raw hex values in pages, Tailwind palette colours (`purple-500`, `emerald-600`, …) in pages, coloured shadows.
- Once step 1 lands, colours are used only through tokens (`bg-primary`, `text-muted-foreground`, `border-border`, status token classes). The shadcn CSS variables in `src/index.css` map to the values above (`--primary` = brand-600, `--background` = gray-50, `--border` = gray-200, …).

## 3. Typography

One family: **Inter** (self-hosted with the app so the installable app works offline). The logo keeps its own wordmark.

| Role           | Size / line height | Weight |
| -------------- | ------------------ | ------ |
| Page title     | 24 / 32            | 600    |
| Section title  | 18 / 28            | 600    |
| Card title     | 16 / 24            | 600    |
| Body (default) | 14 / 20            | 400    |
| Label          | 13 / 18            | 500    |
| Caption        | 12 / 16            | 400    |

- Money, counts and dates use `tabular-nums`. Money is right-aligned with separators and kobo: `₦1,250,000.00`.
- Sentence case for titles, buttons and labels ("New loan request", not "New Loan Request"). No ALL CAPS values.

## 4. Dates

- **Interface:** `02 Dec 2026` (two-digit day, short month, full year) in tables, lists, date pickers, dialogs and toasts.
  - Ranges: `01 Dec 2026 – 28 Feb 2027`. With time: `02 Dec 2026, 14:30`.
  - Always in **Africa/Lagos**. Use the shared `formatDate` helper (step 1); never `toLocaleDateString()`.
- **Exception:** notification messages keep the approved copy with `DD/MM/YYYY`, e.g. "Your leave request submitted on 02/12/2026 has been approved." These are generated by the backend.

## 5. Spacing, radius, elevation

- **Spacing:** 4px grid. Use 4, 8, 12, 16, 24, 32, 48. Use `gap` on flex/grid instead of per-element margins.
- **Radius:** 4px badges · 6px buttons and inputs · 8px cards, dialogs, popovers, toasts. No `rounded-xl/2xl` on surfaces; `rounded-full` only for avatars and dots.
- **Elevation:** two levels only.
  - Flat + 1px border: cards, tables, panels.
  - Overlay shadow (`0 8px 24px rgba(20,26,38,.12), 0 1px 2px rgba(20,26,38,.08)`): menus, popovers, dialogs, toasts.
  - Never `shadow-lg/xl/2xl` on cards or buttons.

## 6. Components

### Buttons

| Variant                            | Use                                                      |
| ---------------------------------- | -------------------------------------------------------- |
| Primary (solid brand)              | The one main action on a page or dialog                  |
| Secondary (white, gray-300 border) | Other actions                                            |
| Ghost                              | Low-emphasis actions, toolbar actions                    |
| Destructive (solid red)            | **Only** the confirm button inside a confirmation dialog |
| Link                               | Inline navigation                                        |

- Sizes: 36px default, 32px small. Text buttons have **no icons**.
- Icon-only buttons are allowed for universal actions (refresh, close, more, previous/next) and always have an `aria-label` and tooltip.

### Page header (`PageHeader`)

Title (what the page is), one-line description (what you can do there), actions on the right. **No icon or coloured tile beside the title.**

### Forms

Label above the field (13px/500), 36px inputs with gray-300 border and brand focus ring, hint or error text under the field (12px). Field errors are shown inline under the field, never in a toast.

### Select (single value from a list)

Same height and border as text inputs; a check marks the chosen option; lists longer than about 8 items get a search box (combobox).

### Dropdown menu (row and page actions)

- **Any table where rows can have more than one action shows a single `⋯` button on every row** that opens a dropdown menu, even on rows where only one item applies, so the column lines up.
- Actions that don't apply to a row are hidden from its menu.
- Items are text only. The destructive item is last, in red, and ends with "…" when it opens a confirmation.
- Clicking anywhere on a row opens its details. A table with only one possible action has no menu; the whole row is clickable.

### Date picker (`DatePicker`, `DateRangePicker`)

Replaces the native `<input type="date">`. The field shows `02 Dec 2026`; the calendar starts weeks on Monday; weekends and public holidays are greyed out when a form counts working days; ranges show the count of working days.

### Modal (dialog)

- Title is a question or a task; description says what will happen.
- Buttons say exactly what they do ("Keep request" / "Cancel request", never "Yes" / "No"). Primary action on the right; footer on a gray-50 band.
- Forms longer than one screen open in a side sheet instead.

### Toasts (Sonner only)

- **One system:** Sonner (`toast` from `sonner`). The custom `NotificationBar` / `NotificationContext` / `showToast` helper is being retired; don't use it in new code.
- **Five tones**, each with its own tinted background, border, icon and title colour: `success`, `error` (danger), `info`, `pending` (warning), `neutral`.
- **One shape:** icon, title, one line of text, close button. **No buttons or links inside toasts**, so every toast is the same height. Text longer than one line is cut with "…".
- Errors stay until dismissed; the rest close after 5 seconds. Position: top right.
- Real-time notification banners use the `info` tone.

| Situation                                                         | Feedback                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| An action finished and the screen doesn't already show the result | Success toast ("Leave request submitted")                          |
| An action failed, or data couldn't load                           | Error toast ("Couldn't submit your request")                       |
| Something happened elsewhere that affects the user                | Info toast (real-time notification)                                |
| A warning about time or state                                     | Pending toast ("Session ends in 2 minutes")                        |
| Something was cancelled, removed or undone                        | Neutral toast ("Loan request cancelled")                           |
| A form field is wrong                                             | Inline message under the field, no toast                           |
| The result is already visible                                     | No toast                                                           |
| Signing in                                                        | No toast: a greeting in the dashboard header ("Good morning, Ada") |

### Empty, loading and error states

- Empty: a short title, one sentence, and at most one action. No illustrations or big icons.
- Loading: skeleton rows for tables and lists.
- Error: inline message in the panel with the cause and how to recover.

### Stat cards (`StatCard`)

Neutral surface. Colour only when the number is itself a status (e.g. a pending count uses the pending tone). Never a different colour per card.

## 7. Status labels (`StatusBadge`)

Badges show a dot plus a sentence-case label, never raw values like `PENDING_REVIEW`. One shared map covers every module:

| Tone    | Label(s)                                                                                            | Values                                                                                                                     |
| ------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| pending | Pending review · Pending approval · Awaiting supervisor · Awaiting HR review · Awaiting HR approval | `pending`, `PENDING_REVIEW`, `PENDING_APPROVAL`, `PENDING_SUPERVISOR_APPROVAL`, `PENDING_HR_REVIEW`, `PENDING_HR_APPROVAL` |
| info    | Awaiting disbursement · Active · On leave                                                           | `PENDING_DISBURSEMENT`, `ACTIVE`, `ON_LEAVE`                                                                               |
| success | Approved · Paid off                                                                                 | `approved`, `APPROVED`, `PAID_OFF`                                                                                         |
| danger  | Rejected                                                                                            | `rejected`, `REJECTED`, `SUPERVISOR_REJECTED`, `HR_REJECTED`, `REJECTED_BY_REVIEWER`, `REJECTED_BY_APPROVER`               |
| neutral | Cancelled · Draft                                                                                   | `CANCELLED`, `draft`                                                                                                       |

New statuses are added to the map in `src/components/system/status.js`, not styled locally (no new `getStatusColor` functions). Unknown values render as a neutral badge with a readable label.

## 8. Icons

One set (`lucide-react`), 16px (18px in the sidebar), stroke 1.75.

- **Keep icons in:** sidebar navigation; icon-only buttons (refresh, close, more actions, pagination); alerts and toasts (to show their tone); inputs where the icon is the meaning (search, calendar).
- **Remove icons from:** page titles (including coloured tiles); card and section titles; text buttons ("New loan request" needs no plus); form labels; stat cards.

## 9. Copy

- Write from the user's side: name things the way employees and HR say them.
- Buttons state exactly what happens ("Submit request", "Download schedule (CSV)").
- Errors say what went wrong and how to fix it, without apologising.

## 10. Rollout

1. ✅ Tokens and base components (`src/index.css`, `tailwind.config.js`, shadcn restyle, shared components in `src/components/system/`, dev-only `/design-system` page). No page logic changes.
2. App shell: sidebar, shared top bar with the notification bell, mobile menu.
3. Employee portal pages.
4. HR portal pages.
5. ESLint guard (flags `bg-gradient-*`, raw hex colours, `shadow-lg/xl/2xl` and Tailwind palette colours in pages) and removal of dead files (`Login copy.jsx`, `RequestTraining_NEW.jsx`, `RequestTraining_UPDATED.jsx`).

When you change a screen, bring it in line with this document in the same change, without mixing in logic changes.
