# Datascape: Cambridge

A React/Vite static app generated from the supplied `datascape-cambridge.jsx` component.

## What is included

- `src/App.jsx` — the Datascape React app.
- `src/main.jsx` — the React entry point.
- `vite.config.js` — Vite config using relative asset paths for GitHub Pages project sites.
- `.github/workflows/deploy.yml` — GitHub Actions workflow that builds and deploys `dist/` to GitHub Pages.

## Deploy on GitHub Pages without a local terminal

1. Create a new GitHub repository.
2. Upload all files and folders from this `github-pages-react-app` directory into the repository. Keep the `.github/workflows/deploy.yml` path exactly as-is.
3. Commit the files to the `main` branch.
4. In the repository, go to **Settings → Pages**.
5. Under **Build and deployment**, set **Source** to **GitHub Actions**.
6. Go to the **Actions** tab. The workflow should run automatically after the commit. If it does not, open **Deploy React app to GitHub Pages** and click **Run workflow**.
7. When the workflow finishes, GitHub will show the published Pages URL in the deployment summary.

## Editing after upload

You can edit files directly on GitHub. Every commit to `main` triggers a fresh build and deployment.

## Local commands, only for someone who does have a terminal

```bash
npm ci
npm run dev
npm run build
```

The app saves player progress in the browser using `localStorage`, so progress is per browser/device unless the user uses the in-game save export/import.
