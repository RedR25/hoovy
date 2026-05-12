# hoovy-frontend

React + Vite + TypeScript. Feature-modular layout — each `src/features/<name>/` owns its API contracts, hooks, components, and pages. Cross-feature plumbing lives in `src/shared/`; app-level wiring (providers, routes) in `src/app/` and `src/providers/`.

## Layering

```
src/
├── app/         App shell: <App /> and route table
├── providers/   Composed provider tree — "DI container" for the UI
├── shared/      Reusable infra (http client, query client, token store, ui)
├── features/    Feature modules (auth, users, …)
│   └── <name>/
│       ├── api.ts          endpoint functions, zod-validated
│       ├── hooks.ts        react-query hooks
│       ├── types.ts        zod schemas + inferred types
│       ├── components/     feature-local UI
│       └── pages/          feature-local routes
├── config/      Typed env access
└── styles/      Global CSS
```

## Rules of thumb

- Features depend on `shared/`, never on each other directly. Cross-feature reuse is a signal to promote something into `shared/`.
- API responses pass through zod parsing in `api.ts` — server drift breaks loudly, not silently.
- Auth and other cross-cutting state are exposed through provider hooks (`useAuth`) — components depend on the hook interface, not on `localStorage` or `axios` directly.
