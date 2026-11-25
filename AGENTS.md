# Orbit 360 frontend: instructions for AI agents and contributors

## UI and styling

All UI work follows **[DESIGN.md](DESIGN.md)**, the approved Orbit 360 design system. Read it before creating or changing any screen or component. The visual reference is `docs/design/design-system-proposal.html`.

These requirements are mandatory for all frontend development:

- Read and follow `DESIGN.md` before implementing a new feature or modifying an interface. All future features must follow the Orbit 360 design system.
- Reuse the existing design tokens, shared components and formatting utilities. Do not introduce hardcoded colours, inconsistent spacing, unnecessary gradients or independent styling systems.
- Follow established patterns for page headers, tables, tabs, buttons, forms, dialogs, status indicators and feedback. Preserve role-based navigation and responsive behaviour.
- When a new reusable UI pattern is required, extend the shared design system rather than building an isolated implementation, and document the pattern in `DESIGN.md`.
- Before developing every new feature or significant UX improvement, create a Markdown implementation plan. Include design system compliance in the verification criteria for every frontend feature.

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

- Before feature development, read the canonical cross-repository backlog at `../Orbit360-BE/docs/PROJECT-TODO.md` and the relevant feature specification. If a specification is missing, record the gap and resolve unclear product decisions before implementing.
- Create a Markdown implementation plan before building a new feature. Update the canonical backlog after completing or partially completing a task, recording blockers and unresolved product decisions. Never mark a feature complete without appropriate verification and recorded results. Do not create a duplicate project backlog.

- React 18 + Vite, JSX, Tailwind CSS, shadcn/ui components in `src/components/ui/`, icons from `lucide-react`.
- API calls go through `src/api/*.service.js` and `apiClient`.
- Run `npm run lint` and `npm run build` before handing work back.
