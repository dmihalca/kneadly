# Doughy Dashboard

This package revamps the existing Doughy calculator into a dashboard-style app with a left navigation sidebar while preserving the calculator formulas and the four built-in dough styles.

## Files

- `components/DoughCalculator.tsx` — dashboard layout + existing calculator logic
- `components/app-sidebar.tsx` — Doughy sidebar with Active Doughs and the four styles
- `app/page.tsx` — root page
- `app/dashboard/page.tsx` — `/dashboard` route

## Required shadcn components

The existing calculator already uses:

- Button
- Card
- Input
- Label
- Separator
- Tabs

Install the shadcn sidebar if you want to use the official sidebar elsewhere in the project:

```bash
npx shadcn@latest add sidebar
```

This Doughy implementation intentionally keeps its sidebar self-contained so it does not require the generated `components/ui/sidebar.tsx` file.

## Icons

Install Lucide if it is not already present:

```bash
npm install lucide-react
```

## Existing dependencies

The calculator uses `date-fns`, which your current project already has:

```bash
npm install date-fns
```

## Notes

- Room temperature remains a manual input and is never changed when switching dough styles.
- Flour blend percentages remain manual inputs and are never changed when switching dough styles.
- The four existing styles remain Neapolitan, New York, Roman, and Detroit.
- The existing BIGA calculation continues to use the entered room temperature.
- The + button is wired to a placeholder message for now; a real custom dough-style editor can be added next.
