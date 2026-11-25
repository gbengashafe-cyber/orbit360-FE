# Orbit 360 frontend: instructions for AI agents and contributors

## UI and styling

All UI work follows **[DESIGN.md](DESIGN.md)**, the approved Orbit 360 design system. Read it before creating or changing any screen or component. The visual reference is `docs/design/design-system-proposal.html`.

Rules that are most often broken:

- No gradients (`bg-gradient-*`), no coloured shadows, no `shadow-lg/xl/2xl` on cards or buttons.
- No icon or coloured tile beside page titles; no icons on text buttons, card titles, form labels or stat cards.
- Brand blue (`#1A66E3`, `bg-primary` once tokens land) only for the main action, active nav, links and focus. No raw hex or Tailwind palette colours (`purple-500`, `emerald-600`, …) in pages.
- Statuses render through the shared status map (`StatusBadge`), never a local `getStatusColor`.
- Tables whose rows can have more than one action use a single `⋯` dropdown menu on every row.
- Interface dates read `02 Dec 2026` (Africa/Lagos). Notification messages from the backend keep `DD/MM/YYYY`.
- Toasts use Sonner only, in the five tones (success, error, info, pending, neutral), with no buttons or links inside. Don't use `NotificationBar`, `NotificationContext` or `showToast` in new code. No toast on sign-in.
- Field validation errors appear under the field, not in a toast.

When you touch an existing screen, bring it in line with DESIGN.md in the same change, and keep styling changes separate from logic changes.

## Project basics

- React 18 + Vite, JSX, Tailwind CSS, shadcn/ui components in `src/components/ui/`, icons from `lucide-react`.
- API calls go through `src/api/*.service.js` and `apiClient`.
- Run `npm run lint` and `npm run build` before handing work back.
