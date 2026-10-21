# Aerid Deck Viewer

Mobile, image-first viewer for the Aerid Konstrari Commander deck. Vite + React + TS + Tailwind, Bun.

Live: https://aerid-deck-viewer.vercel.app

## Develop
```sh
bun install && bun run dev
```

## Revisions
The top tab row shows **Current** (default: `src/deck.json` with every revision applied in order, computed at build time), **Version 1** (the original list in `src/deck.json`, never edited), then one tab per entry in `src/revisions.json`. Each revision tab shows a git-diff view: removed cards on the left (red), added on the right (green). Adding a revision automatically updates Current.

To add the next revision:
1. Append an entry to `src/revisions.json` using exact Scryfall card names (a plain string uses the deck/default printing; `{"name": "Pinecone Strike", "set": "HOB", "cn": "107"}` pins a specific printing):
   ```json
   { "name": "Revision 2", "removed": ["Card A"], "added": ["Card B"] }
   ```
2. Resolve card images: `python3 scripts/fetch_revisions.py` (writes `src/revisions.data.json`; exits non-zero and lists any name that failed to resolve).
3. `bun run build`, commit, push, and deploy.

Each revision lists the change from the previous one, not from Version 1.
