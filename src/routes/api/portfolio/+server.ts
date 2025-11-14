import type { RequestHandler } from '@sveltejs/kit';
import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const STATIC_DIR = join(ROOT, 'static');
const PORTFOLIO_DIRS = [
  join(STATIC_DIR, 'portfolio'),
  join(STATIC_DIR, 'images', 'portfolio', 'photos'),
  join(STATIC_DIR, 'videos', 'portfolio')
];

const IMAGE_EXTS = new Set(['.avif', '.webp', '.jpg', '.jpeg', '.png']);
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.m4v', '.mov']);

async function walk(dir: string, acc: string[] = []): Promise<string[]> {
  let entries: string[] = [];
  try {
    entries = await readdir(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    try {
      const s = await stat(full);
      if (s.isDirectory()) {
        await walk(full, acc);
      } else if (s.isFile()) {
        acc.push(full);
      }
    } catch {
      // ignore
    }
  }
  return acc;
}

export const GET: RequestHandler = async () => {
  const files: string[] = [];
  for (const dir of PORTFOLIO_DIRS) {
    await walk(dir, files);
  }
  const photos: { src: string; slug: string; alt: string }[] = [];
  const videos: { src: string; slug: string; poster?: string; title?: string }[] = [];

  for (const abs of files) {
    const ext = extname(abs).toLowerCase();
    const rel = abs.slice(STATIC_DIR.length).replace(/\\/g, '/');
    const url = rel.startsWith('/') ? rel : `/${rel}`;
    const base = abs.split('/').pop() || 'media';
    const slug = base.replace(ext, '').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
    if (IMAGE_EXTS.has(ext)) {
      photos.push({ src: url, slug, alt: slug.replace(/-/g, ' ') });
    } else if (VIDEO_EXTS.has(ext)) {
      videos.push({ src: url, slug });
    }
  }

  return new Response(
    JSON.stringify({ photos, videos }),
    { headers: { 'content-type': 'application/json' } }
  );
};
