---
trigger: always_on
---

# TanStack Query v5 Architecture & Best Practices Rule

**Usage**: Mandatory standard for all data fetching, caching, server-state management, and mutations across the application.

## Rule

All asynchronous server-state interactions MUST use **TanStack Query v5** (`@tanstack/react-query`). Custom raw `useEffect` + `useState` fetching patterns are strictly forbidden.

## Layer Responsibilities in FSD

### 1. `app` (Providers)
- Mount `QueryClientProvider` within client-side app provider (`src/app/providers/QueryProvider.tsx`).
- Initialize `QueryClient` inside React component state (`useState(() => makeQueryClient())`) to prevent cache sharing across SSR requests.

### 2. `shared/api` (Foundation)
- Export base API client and Query Client factory with optimized defaults:
  - `staleTime: 60 * 1000`
  - `gcTime: 5 * 60 * 1000`
  - `retry: 1`
  - `refetchOnWindowFocus: false`

### 3. `entities/<entity>/api` (Queries & Read State)
- Expose query keys factory and custom `useQuery` hooks or `queryOptions`.
- Define all query hooks for domain entities (e.g. `useCurrentUser`, `useAthleteProfile`, `useCompetitionDetails`).
- Query keys MUST be structured arrays (e.g. `['users', 'profile', userId]`).

### 4. `features/<feature>/api` (Mutations & Actions)
- Expose `useMutation` hooks for user actions (e.g. `useLoginMutation`, `useRegisterForCompetition`).
- Perform query cache invalidation in `onSuccess` via `queryClient.invalidateQueries({ queryKey: [...] })`.
- Handle optimistic updates or error notifications cleanly within the feature.

## Query Key Factory Standard

```typescript
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};
```

## Anti-Patterns

- ❌ `useEffect` with manual `fetch()` in components.
- ❌ Hardcoded string query keys without factories (e.g. `useQuery({ queryKey: ['user'] })`).
- ❌ Direct mutation calls without `useMutation`.
- ❌ Writing comments inside code.
