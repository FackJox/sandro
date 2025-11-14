# Portfolio Media Intake Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move every asset from the external `static/portfolio/sandrogh_…0735` drop into the gallery’s canonical folders (`static/images/portfolio/photos`, `static/videos/portfolio`) with clean slugs, update curated references, and leave the staging folder empty.

**Architecture:** Reuse the `scripts/organize-portfolio.mjs` pipeline to slugify filenames and relocate them, then update `src/lib/content/content.json` to reference the new slugs for showreel stills. Run the existing asset-audit script to confirm no dangling references remain.

**Tech Stack:** Node 20+, pnpm, SvelteKit, Vitest, playwright, custom Node scripts.

---

### Task 1: Stage source folder inside worktree

**Files:**
- Source: `/home/jack/Projects/dev/sandro/static/portfolio/sandrogh_468504191_10160127271947680_1827150890288540492_n-jpg_2025-10-31_0735/**/*`
- Destination: `static/portfolio/`

1. **Copy the folder into the worktree**
   ```bash
   cp -R /home/jack/Projects/dev/sandro/static/portfolio/sandrogh_468504191_10160127271947680_1827150890288540492_n-jpg_2025-10-31_0735 \
         static/portfolio/
   ```
2. **Verify contents**
   ```bash
   ls static/portfolio/sandrogh_468504191_10160127271947680_1827150890288540492_n-jpg_2025-10-31_0735
   ```
   Ensure all 15 `.jpg/.JPG` files are present.

### Task 2: Run portfolio organizer to slugify + relocate assets

**Files:**
- Modify (if needed): `scripts/organize-portfolio.mjs`
- Target output: `static/images/portfolio/photos/*.jpg`

1. **Optional: Adjust script for deterministic casing** (ensure it lowercases extensions). Edit `scripts/organize-portfolio.mjs` so `const targetPath = join(targetDir, `${slug}${ext}`)` uses `ext.toLowerCase()`. Add any logging needed.
2. **Execute script**
   ```bash
   node scripts/organize-portfolio.mjs
   ```
   Expected: “Portfolio organization complete. Moved 15 file(s).”
3. **Confirm destination files**
   ```bash
   ls static/images/portfolio/photos
   ```
   Verify filenames follow slug format (e.g., `earth-puja-21-of-45.jpg`).
4. **Delete empty staging folder**
   ```bash
   rmdir static/portfolio/sandrogh_468504191_10160127271947680_1827150890288540492_n-jpg_2025-10-31_0735
   ```
   If `rmdir` fails due to hidden files, inspect and remove them first.

### Task 3: Point curated content at real slugs

**Files:**
- Modify: `src/lib/content/content.json`

1. **Pick four representative slugs for the showreel stills** (e.g., `earth-puja-21-of-45`, `film-himal-sicker-01`, etc.) by inspecting the new filenames.
2. **Update `rows[showreel].stills` to use those `/images/portfolio/photos/<slug>.jpg` paths.**
3. **Optional:** If any other hardcoded assets (hero, services) should reference the new photos, update them similarly.
4. **Run type checks to ensure JSON still satisfies schema**
   ```bash
   pnpm test content
   ```
   (Or `pnpm check` if no dedicated test; expect pass.)

### Task 4: Verify gallery ingestion + tidy repo

**Files/Commands:**
- Custom audit script (Python one-liner used earlier)
- `git status`

1. **Re-run asset audit to ensure no missing references**
   ```bash
   python - <<'PY'
   from pathlib import Path
   import re
   base = Path('.').resolve()
   pattern = re.compile(r'([\'"])(/(?:static/)?(?:images|videos)/[^\'"]+)\1')
   assets = {}
   for p in (base / 'static').rglob('*'):
       if p.is_file():
           rel = p.relative_to(base / 'static').as_posix()
           assets['/static/' + rel] = p
           assets['/' + rel] = p
   missing = {}
   for p in (base / 'src').rglob('*'):
       if p.is_file():
           text = p.read_text(errors='ignore')
           for m in pattern.finditer(text):
               path = m.group(2)
               if any(ch in path for ch in '*{}[]'):
                   continue
               if path not in assets:
                   missing.setdefault(str(p.relative_to(base)), set()).add(path)
   if missing:
       for file, paths in missing.items():
           print(file)
           for path in paths:
               print(' ', path)
   else:
       print('No missing asset references found')
   PY
   ```
2. **Smoke-test the gallery overlay locally if possible**
   ```bash
   pnpm dev
   ```
   Navigate to the gallery section and confirm the new images appear.
3. **Check git status**
   ```bash
   git status -sb
   ```
   Ensure only the intended files changed (`static/images/portfolio/photos/*`, `scripts/organize-portfolio.mjs` if modified, `src/lib/content/content.json`).
4. **Commit**
   ```bash
   git add static/images/portfolio/photos/*.jpg src/lib/content/content.json scripts/organize-portfolio.mjs docs/plans/2025-11-04-portfolio-media-*.md
   git commit -m "feat: ingest portfolio media and wire gallery"
   ```
