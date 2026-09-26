---
trigger: always_on
---

# Strict No-Comments Rule (Clean Code)

**Usage**: Mandatory code quality rule across all files, slices, components, styles, and configs in this project.

## Rule

**DO NOT WRITE ANY COMMENTS IN CODE FILES.**
Zero inline comments (`// ...`), zero multi-line comments (`/* ... */`), zero JSDoc comments (`/** ... */`), and zero template comments (`{/* ... */}` or `<!-- ... -->`).

## Guidelines

1. **Self-Documenting Code**: Code must be clear, concise, and self-explanatory through meaningful naming of variables, functions, components, interfaces, and types.
2. **No Dead Code**: Never leave commented-out code blocks.
3. **No Explanatory Annotations**: Do not explain why an import is present, what a function does, or how an algorithm works via comments.
4. **No Section Headers in Code**: Do not write comments like `// === Imports ===`, `// UI Component`, `// Types`, `// Handlers`.

## Prohibited vs Allowed

### ❌ Strictly Prohibited
```tsx
// This is a button component
export const SubmitButton = () => {
  // Handle form submission
  const handleSubmit = () => {
    // ...
  };
  return <Button onClick={handleSubmit}>Submit</Button>;
};
```

### ✅ Clean & Compliant
```tsx
export const SubmitButton = () => {
  const handleSubmit = () => {
    // nothing commented here
  };
  return <Button onClick={handleSubmit}>Submit</Button>;
};
```
