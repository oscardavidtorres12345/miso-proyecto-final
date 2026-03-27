# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (Vite)
npm run build        # Type check + production build
npm run lint         # Run ESLint
npm run test         # Run all tests once
npm run test:watch   # Run tests in watch mode
```

To run a single test file:
```bash
npx vitest run tests/unit/components/Header.spec.tsx
```

## Architecture

### Tech Stack
- **React 18** + **TypeScript** (strict mode, no unused vars/params)
- **React Router v7** (BrowserRouter)
- **Vite** as build tool with `@` alias pointing to `./src`
- **Tailwind CSS** + **Radix UI** / **shadcn** for UI
- **i18next** + **react-i18next** for i18n
- **date-fns** for date utilities (use `date-fns/locale` when locale-aware formatting is needed)
- **Vitest** + **React Testing Library** for tests

### State Management
No Redux or Zustand — state is managed via React Context + custom hooks:
- `SearchContext` (`src/context/SearchContext.tsx`) — destination, dateRange, guests; powered by the `useSearchState` hook
- `I18nContext` (`src/context/I18nContext.tsx`) — selected country and active language; calls `i18n.changeLanguage()` on change

Both contexts are provided at the root in `App.tsx`, wrapped inside `BrowserRouter`.

### Routing
Defined in `src/App.tsx`:
- `/` → `Home`
- `/login` → `Login`
- `/search` → `SearchResults`

The Header receives a `variant` prop derived from the current pathname.

### Internationalization
- Config: `src/i18n/index.ts`; translations in `src/i18n/locales/{es,en}.ts`
- Country → language mapping is in `LANGUAGE_MAP` (exported from `src/i18n/index.ts`)
- Default and fallback language: `es`
- When a component needs the current locale for date-fns, read `i18n.language` via `useTranslation()` and map it to the appropriate `date-fns` locale object

### Styling
- Tailwind with custom theme: primary `#7DA10D`, secondary `#213500`; custom font Quicksand
- Custom breakpoints: `mobile` (≤650px), `tablet` (≤768px), `tablet-lg` (≤1024px)
- CSS variables defined in `src/index.css`
- `cn()` helper from `src/lib/utils.ts` (clsx + tailwind-merge) for conditional class merging

### Testing
- Test files live in `tests/unit/`
- Use `renderWithProviders` (`tests/unit/renderWithProviders.tsx`) instead of RTL's `render` — it wraps components with `MemoryRouter` and `I18nProvider`
- Setup file (`tests/unit/setup.ts`) imports `@testing-library/jest-dom` and initialises i18n

### Services Layer
`src/services/` is intentionally empty — backend API integration has not been implemented yet.
