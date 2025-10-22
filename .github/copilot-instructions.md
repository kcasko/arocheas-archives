<!--
Short, repository-specific instructions for AI coding agents working on Arochea's Archives.
Keep this file concise — focus on patterns, important files, and explicit examples that make an agent productive.
-->

# Copilot instructions — Arochea’s Archives

Summary
- This repo is a mostly-static frontend for Arochea’s Archives with a small Cloudflare-style `functions/api/` folder that proxies to a remote Workers API.
- Primary user-facing file: `index.html`. Small serverless endpoints: `functions/api/items.js`, `games.js`, `packs.js`.

What to know first
- The frontend is a static HTML page (no build step in repo). Styling is inline in `index.html` and assets are expected to be served from `/assets` or external URLs.
- The `functions/api/*.js` modules implement Cloudflare Pages Functions-style handlers exporting `onRequestGet` that proxy requests to an external API at `https://arocheas-archives-api.kristi-casko.workers.dev`.
- The page fetches `/api/characters` (see `index.html`) but there is no `functions/api/characters.js` in this repo — expect some routes to be provided by the external API or another repo. Confirm before adding a new endpoint.

Important files
- `index.html` — single-page frontend; interactive DOM code lives here (fetch calls, UI logic, music toggle).
- `functions/api/*.js` — serverless proxy endpoints. Pattern:
  - export async function onRequestGet(context) { const url = '<remote>'; const res = await fetch(url); return new Response(JSON.stringify({ ok: res.ok, status: res.status, body: await res.text() }), { headers: { 'Content-Type': 'application/json' } }); }
- `README.md` — project description & intended stack (Next.js/Tailwind planned but repo currently static).

Editing conventions & style
- Preserve the project’s aesthetic choices (pastel palette, playful copy). Keep UI changes tight and minimal unless creating a redesign branch.
- For the `functions/api` code, follow the existing proxy pattern (don't change response shape unless all callers are updated). Tests or callers expect the wrapper object { ok, status, statusText, body }.
- Avoid introducing a Node server or heavy runtime; the repo expects lightweight serverless functions.

Examples of common tasks
- Add a new proxy endpoint for `/api/characters` (follow `functions/api/items.js`):
  - Create `functions/api/characters.js` exporting `onRequestGet` that proxies to the same remote API's `/api/characters` path.
- Update fetch in `index.html` only if the endpoint exists locally or the external API shape changes. Example fetch call (current):
  - fetch('/api/characters').then(res => res.json()).then(data => { /* expects data.characters array */ })

Testing, build, and debugging
- There is no repository-level build script. To test static frontend, open `index.html` in a browser or serve the folder with a static server (e.g., `npx http-server .`).
- Serverless functions are written in Cloudflare Pages Functions style — test them by deploying to Cloudflare Pages or using a compatible local runner. If you need to run them locally, use a Cloudflare Pages Functions emulator or write minimal Node wrappers for manual testing.
- Network/dependency notes: the functions rely on an external Workers API at `https://arocheas-archives-api.kristi-casko.workers.dev`. When modifying endpoints, verify remote availability and response shapes.

Integration & cross-repo notes
- The README references related repos in the Arocheaverse. Some APIs or assets (images, audio) may be hosted in other repos (see `index.html` audio src pointing at `arocheaplays` repo). When changing asset paths, confirm cross-repo links.

What NOT to change without approval
- Global aesthetic palette and tone (colors and copy). These are intentional branding choices.
- Response JSON contract from `functions/api/*` proxies unless you update all callers (frontend or other services).

If you need more information
- Ask for the remote API schema or a link to the Workers repo. Also ask where the live site is hosted if you need to validate runtime behavior (Cloudflare Pages domain).

Thanks — update this file if you add new conventions or endpoints.
