import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const astroRoot = path.join(root, 'dist-astro');
const targets = [
  { src: path.join(astroRoot, 'assisted-living'), dest: path.join(root, 'dist', 'assisted-living') },
  { src: path.join(astroRoot, 'facility'), dest: path.join(root, 'dist', 'facility') }
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
