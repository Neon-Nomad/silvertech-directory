import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const astroRoot = path.join(root, 'dist-astro');
const targets = [
  // Shared Astro CSS/assets required by state/city/guide pages.
  { src: path.join(astroRoot, '_astro'), dest: path.join(root, 'dist', '_astro') },
  { src: path.join(astroRoot, 'assisted-living'), dest: path.join(root, 'dist', 'assisted-living') },
  // Facility detail URLs must resolve through the React app route (`/facility/:id`)
  // so the full dynamic template renders instead of the static Astro shell.
  { src: path.join(astroRoot, 'guides'), dest: path.join(root, 'dist', 'guides') }
];

let copiedAny = false;
for (const target of targets) {
  if (!fs.existsSync(target.src)) {
    continue;
  }
  fs.mkdirSync(target.dest, { recursive: true });
  fs.cpSync(target.src, target.dest, { recursive: true, force: true });
  copiedAny = true;
  console.log('[merge_astro] Copied', target.src, '->', target.dest);
}

if (!copiedAny) {
  console.error('[merge_astro] No Astro output found under:', astroRoot);
  process.exit(1);
}
