---
trigger: always_on
---

# Feature-Sliced Design (FSD) Architectural Rule

**Usage**: Architectural constraints and directory guidelines for frontend projects.

## Rule

Strictly enforce FSD layer hierarchy, slice boundaries, and Public API encapsulation to ensure maintainability, scalability, and predictable dependency trees.

## Layer Hierarchy (Top to Bottom)

Code may ONLY import from layers strictly below its current layer.

```
app        # App initialization, providers, routing, global styles
  ↓
pages      # Page views, route entrypoints, high-level composition
  ↓
widgets    # Large, autonomous UI blocks (e.g., Header, Sidebar, ProductGrid)
  ↓
features   # User actions & business scenarios (e.g., AuthByEmail, AddToCart, FilterCatalog)
  ↓
entities   # Domain entities (e.g., User, Product, Order) — models, UI, api
  ↓
shared     # Independent reusable code (e.g., UI kit, API client, utils, types)

```

## Core Constraints

### 1. Directional Dependency Principle

* **Allowed**: Top-down imports (e.g., `pages` → `features` → `entities` → `shared`).
* **Forbidden**: Upward imports (e.g., `entities` importing from `features` or `pages`).
* **Forbidden**: Cross-imports on the same layer (e.g., `features/search` importing from `features/filter`). Combine them in a higher layer (`widgets` or `pages`).
* **Exception**: `shared` layer modules can import from other `shared` modules.

### 2. Public API Encapsulation

Every slice in `pages`, `widgets`, `features`, and `entities` MUST expose a single entry point via `index.ts`.

* **Rule**: Import ONLY from the slice root (`index.ts`). Deep imports into internal files are strictly forbidden.
* **Allowed**: `import { ProductCard } from '@/entities/product'`
* **Forbidden**: `import { ProductCard } from '@/entities/product/ui/ProductCard'`

### 3. Slice Structural Blueprint

```text
src/
├── app/                  # App setup, providers, styles, entrypoint
├── pages/                # Slices named by route (e.g., catalog, profile)
├── widgets/              # Self-contained UI compositions
├── features/             # User interactions carrying business value
│   └── <feature-name>/
│       ├── ui/           # Feature-specific components
│       ├── model/        # State, actions, selectors, hooks
│       ├── api/          # Endpoints, queries, mutations
│       ├── lib/          # Helpers specific to this feature
│       └── index.ts      # Public API export
├── entities/             # Business domain entities
│   └── <entity-name>/
│       ├── ui/           # Entity display components
│       ├── model/        # Domain state, types, schema
│       ├── api/          # Base entity API calls
│       └── index.ts      # Public API export
└── shared/               # Domain-agnostic utilities and UI
    ├── ui/               # Design system / UI kit (Button, Input, Modal)
    ├── api/              # HTTP client, base config, interceptors
    ├── lib/              # Generic utilities, formatters, hooks
    └── config/           # Environment variables, constants

```

## Quick Reference & Examples

### Public API Export (`features/add-to-cart/index.ts`)

```typescript
// Always explicitly export only what is required externally
export { AddToCartButton } from './ui/AddToCartButton';
export { useAddToCart } from './model/useAddToCart';
export type { AddToCartPayload } from './model/types';

```

### State & API Responsibilities

* **`shared/api`**: Base HTTP client setup, common headers, auth token interceptors.
* **`entities/<entity>/api`**: Entity CRUD endpoints (`getUser`, `updateProduct`).
* **`entities/<entity>/model`**: Base entity state and data structures.
* **`features/<feature>/model`**: Interaction state, form management, custom business logic.

### 4. Strict File Decomposition & 60-Line Limit

* **Hard Limit**: No file may exceed **60 lines of code**. Target range: **25–50 lines**.
* **Dedicated Component Folders**: Every UI component and subcomponent MUST live in its own dedicated directory under `ui/` (e.g. `ui/UserCardHeader/`), containing:
  - `ComponentName.tsx`
  - `ComponentName.module.css`
  - `index.ts` (local export)
  * **Forbidden**: Never place multiple components and their `.module.css` side-by-side in a flat `ui/` root.
* **Separation of Concerns**: Separate types (`model/types.ts`), sub-components (`ui/<SubComponent>/...`), hooks (`model/useHook.ts`), and styles.
* **Never write monolithic files**: If a component approaches 50 lines, proactively extract sub-parts into dedicated component folders.

## Why

FSD prevents spaghetti code, eliminates circular dependencies, and keeps modules loosely coupled. Enforcing strict directional imports, Public API boundaries, and complete micro-decomposition (under 60 lines) ensures that changes in one module don't unexpectedly break unrelated parts of the application and keeps all files effortlessly readable.