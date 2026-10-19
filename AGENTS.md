# SME FinanceHub frontend

React 19 application built with Vite, TypeScript, and Tailwind CSS v4.

## Project structure

- `src/main.tsx` mounts the application and global styles.
- `src/App.tsx` and `src/app/` configure providers and routes.
- `src/pages/` contains page-level UI.
- `src/api.ts` contains the shared backend API client.
- `vite.config.ts` configures the development server and `/api` proxy.

## Development

Run `pnpm dev` from this directory. The frontend uses port 8443 by default and proxies `/api` to `http://localhost:4000`; set `API_URL` to override the backend URL.

Use Tailwind utility classes in JSX and global styles or theme customization in `src/index.css`.
