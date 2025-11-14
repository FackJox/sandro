# Portfolio Media Intake — Design

## Goals
- Import every asset from `/home/jack/Projects/dev/sandro/static/portfolio/sandrogh_468504191_10160127271947680_1827150890288540492_n-jpg_2025-10-31_0735/` into the site so the gallery auto-discovers them without hand-editing content rows.
- Enforce a tidy, deterministic naming scheme that mirrors the existing slug logic (`lowercase`, words separated by `-`, no spaces/punctuation) and co-locates images under `static/images/portfolio/photos/`.
- Leave `static/portfolio/` empty (and delete the now-unused staging folder) after import so future audits don't flag duplicates or “hallucinated” media.

## Source Inventory
- 15 `.jpg/.JPG` stills (no videos) with descriptive names like `earth puja (21 of 45).JPG`, `push (17 of 22).jpg`, `Film Himal Sicker 01.jpg`.
- All files live in the single dated directory listed above. There are no nested subfolders.
- The target worktree (`.worktrees/prompt-10-11-gallery`) currently has empty `static/images/portfolio/photos/` and `static/videos/portfolio/`, so new files won’t clash.

## Naming Scheme
- Reuse the `slugify` helper already present in `scripts/organize-portfolio.mjs`: lowercase, strip characters outside `[a-z0-9-_]`, collapse to single `-`, and trim edges.
- Preserve extensions but normalize case to lowercase `.jpg`.
- Example mapping: `earth puja (21 of 45).JPG` → `earth-puja-21-of-45.jpg`.
- This matches how `galleryPhotos` derives slugs (it slugifies filenames after stripping extensions), ensuring a photo’s slug aligns with its filename for predictable URLs (`/images/portfolio/photos/earth-puja-21-of-45.jpg`).

## Workflow
1. Copy the source folder into this worktree’s `static/portfolio/` keeping the original directory name so the ingest script can find it.
2. Run (or slightly adjust) `scripts/organize-portfolio.mjs` so it:
   - Recursively walks `static/portfolio/**`.
   - Slugifies each filename and renames/moves images into `static/images/portfolio/photos/`.
   - Removes the original file once moved (Node’s `rename` already does this).
3. After all files move successfully, delete the now-empty dated folder under `static/portfolio/`.
4. Optionally, prune `static/portfolio/` entirely if it is empty; otherwise keep it as the drop-zone for future imports.

## Integration Points
- `galleryPhotos` already merges the curated `photoGallery` row with every file under `/static/images/portfolio/photos/**/*`, so the new assets will appear automatically in the photo rails and overlay without additional JSON edits.
- For curated sections (e.g., showreel stills) we’ll repoint references to a subset of the new slugs to guarantee those sections showcase real media.
- Tests are unaffected because they consume the auto-generated `galleryPhotos` list; no snapshots or fixtures reference explicit file lists today.

## Verification
- Re-run the custom asset-audit script (used earlier) to ensure no lingering `/images/...` references lack backing files.
- Manually open the gallery overlay (or run existing e2e tests once stabilized) to confirm new tiles render and aspect ratios are detected via the `PhotoTile` resize callback.
