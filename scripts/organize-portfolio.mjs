#!/usr/bin/env node
import { mkdir, readdir, rename, stat } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

const ROOT = process.cwd();
const STATIC_DIR = join(ROOT, 'static');
const SOURCE_DIR = join(STATIC_DIR, 'portfolio');
const PHOTO_DIR = join(STATIC_DIR, 'images', 'portfolio', 'photos');
const VIDEO_DIR = join(STATIC_DIR, 'videos', 'portfolio');

const IMAGE_EXTS = new Set(['.avif', '.webp', '.jpg', '.jpeg', '.png']);
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.m4v']);

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '');

async function ensureDirs() {
  await mkdir(PHOTO_DIR, { recursive: true });
  await mkdir(VIDEO_DIR, { recursive: true });
}

async function walk(dir, files = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    return files;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, files);
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

async function moveFile(absPath) {
  const extRaw = extname(absPath);
  const base = basename(absPath, extRaw);
  const ext = extRaw.toLowerCase();
  const slug = slugify(base) || 'media';
  const targetDir = IMAGE_EXTS.has(ext) ? PHOTO_DIR : VIDEO_EXTS.has(ext) ? VIDEO_DIR : null;
  if (!targetDir) return false;
  const targetPath = join(targetDir, `${slug}${ext}`);
  try {
    await rename(absPath, targetPath);
    console.log(`→ Moved ${absPath} -> ${targetPath}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ Failed to move ${absPath}: ${error.message}`);
    return false;
  }
}

async function main() {
  await ensureDirs();
  const sourceInfo = await stat(SOURCE_DIR).catch(() => null);
  if (!sourceInfo || !sourceInfo.isDirectory()) {
    console.log('No static/portfolio directory found. Nothing to organize.');
    return;
  }
  const files = await walk(SOURCE_DIR);
  if (files.length === 0) {
    console.log('No files found in static/portfolio.');
    return;
  }
  let moved = 0;
  for (const abs of files) {
    if (await moveFile(abs)) moved += 1;
  }
  console.log(`Portfolio organization complete. Moved ${moved} file(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

