import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'dist-astro', 'assisted-living');
const destDir = path.join(root, 'dist', 'assisted-living');

if (!fs.existsSync(srcDir)) {
  console.error('[merge_astro] Source not found:', srcDir);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });

// Copy only the assisted-living tree (city pages) into the main Vite dist.
fs.cpSync(srcDir, destDir, { recursive: true, force: true });

console.log('[merge_astro] Copied Astro city pages into Vite dist.');
