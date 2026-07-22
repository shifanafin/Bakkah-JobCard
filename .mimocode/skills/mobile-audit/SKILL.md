---
description: "Audit and fix mobile/tablet responsiveness across workshop pages"
---

# Mobile Responsiveness Audit

Audit the Bakkah workshop app for mobile/tablet usability. The goal is to make the app feel like a native mobile app — no wasted blank space, touch-friendly controls, proper stacking.

## Scope

Focus on these high-traffic pages (most-edited in history):
- `app/workshop/transactions/page.tsx`
- `app/workshop/admin/hr/page.tsx`
- `app/workshop/job-cards/page.tsx`
- `app/workshop/job-cards/new/page.tsx`
- `app/workshop/job-cards/[id]/page.tsx`
- `app/HomeClient.tsx`
- `components/layout/Sidebar.tsx`

## Audit Checklist

For each page, check:

1. **Layout stacking**: Tables and grids must collapse to single-column on mobile (`<768px`). Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` etc.
2. **Touch targets**: Buttons, links, and interactive elements must be ≥ 44×44px. Use `min-h-[44px] min-w-[44px]`.
3. **Text readability**: No horizontal scrolling. Long text must wrap or truncate with ellipsis.
4. **Form inputs**: Full-width on mobile. Date pickers and dropdowns must not overflow the viewport.
5. **Sidebar**: Must be collapsible/drawer on mobile, not permanently visible.
6. **Blank space**: No large empty areas. Content should fill available width on small screens.
7. **Modals/dialogs**: Must not overflow. Use `max-h-[90vh] overflow-y-auto`.
8. **Fixed elements**: Header, nav, FAB buttons must not overlap content.

## Output Format

For each page audited:
- List issues found with specific line references
- Apply fixes using Tailwind responsive classes
- Re-run `npx tsc --noEmit` to verify no type errors introduced

## Notes

- The project uses Tailwind CSS 3.4 with `tailwind-merge`.
- Key breakpoints: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`.
- Prefer `flex` and `grid` over fixed widths for responsiveness.
- Use `lucide-react` icons which scale well at different sizes.
