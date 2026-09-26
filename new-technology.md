---
trigger: always_on
---

# Consolidated Architecture & Context Rules (FSD + Styling + Stack + VCS)

**Usage**: Mandatory developer guidelines, architectural constraints, and workflow rules for the `fsp-platform` frontend codebase.

---

## 1. Context7 MCP & Documentation Protocol

Always use the **Context7 MCP** connector (`resolve-library-id`, `get-library-docs` / `query-docs`) to retrieve live, version-specific documentation, modern API signatures, and configuration code before generating or refactoring framework setup files.

### Rules:

* **Zero Stale Code**: Never rely on pre-2024 training data patterns for React, Next.js, Vite, Tailwind, or `shadcn/ui`.
* **Target Versioning**: Explicitly target modern library signatures (e.g., React 19, Tailwind v4, TypeScript 5.x) using Context7 library resolution.
* **Automatic Invocation**: Trigger Context7 tools automatically when scaffoldings, API clients, or library integrations are requested.

---

## 2. Latest Technology Stack Requirements

All project files and dependencies must strictly target the newest stable runtime releases:

* **Framework/Bundler**: React 19 + Vite 6+ (or Next.js 16+ App Router)
* **Server State & Data Fetching**: TanStack Query v5 (`@tanstack/react-query`)
* **Type System**: TypeScript 5.x+ (strict mode enabled in `tsconfig.json`)
* **Utility Styling**: Tailwind CSS v4 (or latest v3.4+ engine)
* **UI & Icons**: Modern `shadcn/ui` primitives (Radix UI) + `lucide-react`
* **Strict Anti-Pattern**: Deprecated React hooks/APIs (e.g., legacy `ReactDOM.render`, old context providers without `use`) are strictly forbidden.

---

## 3. Feature-Sliced Design (FSD) Architecture

Maintain strict layer boundaries, directionality, and public API encapsulation under `src/`.

### Directory Tree & Hierarchy (Top-to-Bottom)

Modules may ONLY import from layers strictly below them:

```text
src/
├── app/          # Initializers, global providers, styles, entrypoint
│     ↓
├── pages/        # Route views & high-level compositions
│     ↓
├── widgets/      # Standalone composite blocks (Header, Sidebar, CatalogGrid)
│     ↓
├── features/     # User actions & business scenarios (AddToCart, FilterCatalog)
│     ↓
├── entities/     # Domain entities (User, Product, Order)
│     ↓
└── shared/       # Domain-agnostic reusable code (UI kit, API, lib, config)

```

### Constraints:

1. **Directional Dependency**: Upward imports (e.g., `entities` importing `features`) are forbidden.
2. **No Cross-Slice Imports**: Slices on the same layer (`features/a` and `features/b`) CANNOT import each other directly. Combine them in `widgets` or `pages`.
3. **Public API (`index.ts`)**: Every slice must expose its interface exclusively via an `index.ts` file in its root.
* ✅ `import { UserCard } from '@/entities/user';`
* ❌ `import { UserCard } from '@/entities/user/ui/UserCard';` *(Forbidden Deep Import)*



---

## 4. Styling Architecture: CSS Modules vs. Tailwind

Maintain clean encapsulation by separating utility styling (Primitives) from domain layout (Slices).

```text
┌───────────────────────────────────────────────┬────────────────────────────────┐
│ Component Type & Layer                        │ Permitted Styling Engine       │
├───────────────────────────────────────────────┼────────────────────────────────┤
│ `shared/ui/*` (shadcn/ui primitives)          │ Tailwind CSS + cn() utility    │
│ `entities`, `features`, `widgets`, `pages`    │ CSS Modules (*.module.css) ONLY │
└───────────────────────────────────────────────┴────────────────────────────────┘

```

### Rules:

* **No Utility Classes in Business JSX**: Do not write inline Tailwind utility strings (`className="flex p-4 bg-gray-100"`) inside `entities`, `features`, `widgets`, or `pages`.
* **CSS Modules Usage**: Write scoped CSS using `*.module.css` files for custom domain styling, layouts, and animations.
* **Overriding Primitives**: Pass module class references to `shared/ui` primitives using `className={styles.override}`.

```tsx
// features/auth-by-email/ui/LoginForm.tsx
import { Button } from '@/shared/ui/button'; // Tailwind inside primitive
import { Input } from '@/shared/ui/input';   // Tailwind inside primitive
import styles from './LoginForm.module.css';   // CSS Module for layout

export const LoginForm = () => (
  <form className={styles.form}>
    <Input type="email" placeholder="user@example.com" />
    <Button className={styles.submitBtn}>Submit</Button>
  </form>
);

```

---

## 5. `shadcn/ui` Primitive Composition

* **Single Source of Truth**: Keep all base UI primitives (Button, Input, Dialog, Card) exclusively in `shared/ui`.
* **No Native Element Duplication**: Do NOT write raw HTML elements (`<button>`, `<input>`) in higher layers (`features`, `widgets`) when a `shadcn/ui` primitive exists in `shared/ui`.

---

## 6. VCS, Branching & Micro-Commit Guidelines

Target Repository: `[https://github.com/0himera/fsp-platform.git](https://github.com/0himera/fsp-platform.git)`

### Rules:

1. **Branch Protection**: Never commit or push directly to `main`.
2. **Dedicated Branch**: Perform all development work on `frontend` (or feature branches like `feat/login`).
3. **Micro-Commit Style**: Write short, atomic commit messages (< 50 characters). Commit immediately upon finishing tiny functional units.

### Setup & Command Workflow:

```bash
# Initialize & set working branch
git init
git remote add origin https://github.com/0himera/fsp-platform.git
git checkout -b frontend

# Micro-commit workflow
git add .
git commit -m "init fsd directory tree"

git add .
git commit -m "add shared/ui button primitive"

# Safe push to remote branch
git push -u origin frontend

```

---

## 7. TanStack Query v5 Architecture

* **Provider**: Wrap app root with `QueryClientProvider` in `src/app/providers/QueryProvider.tsx`.
* **Central Client**: Configure standard `QueryClient` defaults in `shared/api/query-client.ts`.
* **Queries**: Slices in `entities/<entity>/api` define queries using structured query key factories and `useQuery`.
* **Mutations**: Slices in `features/<feature>/api` define mutations using `useMutation` with query invalidation.
* **No Raw Fetch in Components**: Never use `useEffect` + `useState` to fetch server data.

---

## 8. Strict No-Comments Rule (Clean Code)

* **Prohibition**: Zero comments in code files (`// ...`, `/* ... */`, `{/* ... */}`).
* **Self-Documentation**: Code clarity must be achieved through expressive naming, TypeScript types, and modular structure.
* **Exceptions**: None. All code written must be strictly comment-free.

---

## 9. Full Code Decomposition & 60-Line Rule
 
* **Hard Maximum**: Strictly **≤ 60 lines per file** (target: **25–45 lines**).
* **Dedicated Component Folders**: Every UI component and subcomponent MUST have its own dedicated directory (e.g. `ui/UserCard/`, `ui/UserCardHeader/`), containing:
  - `ComponentName.tsx`
  - `ComponentName.module.css`
  - `index.ts`
  * **Forbidden**: Do not store multiple components and CSS modules flat in the same parent directory.
* **Granular CSS Modules**: Pair each component with its own short, isolated CSS Module inside its dedicated folder.
* **No Monoliths**: Zero tolerance for bloated files. Proactively split before reaching 60 lines.