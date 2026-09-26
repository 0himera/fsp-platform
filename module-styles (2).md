---
trigger: always_on
---

# Modular Styling & Tailwind Rule

**Usage**: Mandatory CSS architecture and styling guidelines across all UI components.

## Rule

Enforce strict encapsulation of component styles. Use **CSS Modules** (`*.module.css` / `*.module.scss`) by default for all custom components. **Tailwind CSS** is strictly restricted to `shadcn/ui` components (or designated design-system primitives) and is forbidden in custom UI code.

## Component Styling Rules

### 1. Custom Components & Slices (`entities`, `features`, `widgets`, `pages`)

* **Mandatory**: Use **CSS Modules** for custom layout, positioning, animations, and component-specific styling.
* **Forbidden**: Do NOT use inline utility classes (Tailwind) in custom JSX/TSX elements.

#### Example: CSS Module Usage (`features/add-to-cart/ui/AddToCartButton.tsx`)

```tsx
import styles from './AddToCartButton.module.css';

export const AddToCartButton = () => {
  return (
    <button className={styles.button}>
      <span className={styles.label}>Add to Cart</span>
    </button>
  );
};

```

```css
/* AddToCartButton.module.css */
.button {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 6px;
  background-color: var(--color-primary);
  transition: opacity 0.2s ease;
}

.label {
  font-weight: 600;
  color: var(--color-white);
}

```

---

### 2. UI Primitives & `shadcn/ui` (`shared/ui`)

* **Allowed**: **Tailwind CSS** utility classes are permitted ONLY inside `shadcn/ui` components and UI library wrappers in `shared/ui`.
* **Allowed**: Use `cn()` (`clsx` + `tailwind-merge`) exclusively inside `shared/ui` to merge Tailwind class names for primitive variants.

#### Example: `shadcn/ui` Component (`shared/ui/button.tsx`)

```tsx
import { cn } from '@/shared/lib/utils';

export const Button = ({ className, variant, ...props }) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none",
        variant === "outline" && "border border-input bg-background hover:bg-accent",
        className
      )}
      {...props}
    />
  );
};

```

---

## Allowed Exception Matrix

| Component Type | Location | Styling Method | Tailwind Allowed? |
| --- | --- | --- | --- |
| `shadcn/ui` Primitives | `shared/ui/*` | Tailwind CSS (`cn()`) | ✅ **Yes** |
| Custom Business UI | `entities/*`, `features/*`, `widgets/*` | CSS Modules (`*.module.css`) | ❌ **No** |
| Page Layouts | `pages/*` | CSS Modules (`*.module.css`) | ❌ **No** |
| Global Reset / Theme Vars | `app/styles/*` | Global CSS (`globals.css`) | ❌ **No** (Vars only) |

---

## Anti-Patterns & Violations

### ❌ Violation 1: Using Tailwind in Business Slices

```tsx
// features/auth/ui/LoginForm.tsx
// FORBIDDEN: Tailwind classes in custom feature components
export const LoginForm = () => {
  return <div className="flex flex-col p-4 bg-gray-100 rounded-lg">...</div>;
};

```

### ❌ Violation 2: Global Unscoped CSS in Slices

```tsx
// entities/product/ui/ProductCard.tsx
import './ProductCard.css'; // FORBIDDEN: Pollutes global namespace. Must be *.module.css

```

---

## Why

1. **Isolation & Zero Side-Effects**: CSS Modules generate unique scoped class names, eliminating class name collisions across large teams and deep FSD layers.
2. **Clean JSX**: Keeps component code readable without cluttered strings of utility classes in complex domain logic (`features`/`widgets`).
3. **Third-Party Compatibility**: Confining Tailwind strictly to `shadcn/ui` leverages the speed of component libraries without letting utility class churn spill into core business components.