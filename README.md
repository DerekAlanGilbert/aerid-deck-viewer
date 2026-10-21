# Aerid Deck Viewer

Mobile, image-first viewer for the Aerid Konstrari Commander deck. Vite + React + TS + Tailwind, Bun.

Live: https://aerid-deck-viewer.vercel.app

## Develop
```sh
bun install && bun run dev
```

## Revisions
The top tab row shows **Version 1** (the base deck in `src/deck.json`, which never changes) followed by one tab per entry in `src/revisions.json`. Each revision tab shows a git-diff view: removed cards on the left (red), added cards on the right (green).

To add the next revision:
1. Append an entry to `src/revisions.json` using exact Scryfall card names:
   ```json
   { "name": "Revision 2", "removed": ["Card A"], "added": ["Card B"] }
   ```
2. Resolve card images: `python3 scripts/fetch_revisions.py` (writes `src/revisions.data.json`; exits non-zero and lists any name that failed to resolve).
3. `bun run build`, commit, push, and deploy.

Each revision lists the change from the previous one, not from Version 1.
