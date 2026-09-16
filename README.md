# AI Factory

A static, scroll-driven explanation of AI inference. Plain HTML, CSS and JavaScript; no framework, runtime dependencies, API keys, AI backend or installation step. Node.js 22 or newer is needed only for local commands.

## Develop and verify

```sh
npm run dev      # http://127.0.0.1:4173
npm run check    # syntax, timeline and deployment tests
npm run build   # validates assets and replaces dist/
npm run preview # serves dist/ at http://127.0.0.1:4174
```

Run commands from this directory. `PORT` overrides the server port. Both servers bind to localhost. Preview serves the last build, so run `npm run build` again after source changes. The deployment test in `npm run check` also regenerates `dist/`. Preview the built output before uploading it; opening index.html through a file URL does not support its ES modules.

## GitHub source versus deployment files

For ongoing development, upload this folder's source files, `package.json`, `.gitignore`, `scripts/` and **all of `public/frames/`**. This folder can be the repository root; no parent folders are required for normal builds. Generated `dist/` is ignored by version control.

For a static repository with no build step, upload only the **contents of `dist/`** instead. It is a deployment copy, separate from the development project.

## Deploy

Use any static host with these settings:

- Project/base directory: `website` (or this folder as a standalone repository).
- Build command: `npm run check && npm run build`.
- Publish/output directory: `dist` relative to this folder.
- Runtime environment variables: none.

For manual deployment, upload the **contents** of `dist/`. There are no server routes or SPA rewrites to configure. Relative asset URLs also support hosting in a subdirectory. Use HTTPS on the public host. Files are not fingerprinted, so configure revalidation instead of immutable caching when setting custom cache rules.

The build copies only the four application files and referenced frame sequences. It excludes source documentation, tests, logs, production files and asset provenance metadata. It removes stale generated files on every build. `dist/` is disposable and ignored by version control.

## Source map

- `index.html`: the shared scene, copy and token/answer regions.
- `styles.css`: desktop and mobile composition, image-edge masks, text shading and bottom fades.
- `app.js`: frame loading, bounded image cache and scroll rendering.
- `timeline.js`: the single source for narrative, prompt, answer and token timing.
- `public/frames/`: prepared WebP sequences and their source manifest.
- `scripts/`: development server, build, tests and optional frame regeneration.

Scrolling forward or backward drives both the imagery and the scripted reply. There is no live model call. Token pieces and candidate choices are illustrative, not a model trace. The prepared source assets allow normal builds without Blender, Sharp, or any parent folder.

## Remaining limits

The renders are 1280px wide and separate shots have visible cuts. This is a scroll illustration, not interactive 3D. CSS honors reduced-motion transitions, but scroll still changes frames. Cross-browser, assistive-technology and slow-network testing should be completed before a public launch.
