import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const astroRoot = path.join(root, 'dist-astro');
const careTypeDirs = [
  'assisted-living',
  'memory-care',
  'nursing-homes',
  'independent-living',
  'residential-care',
  'adult-day-services',
  'ccrc',
];
const topLevelAstroRouteDirs = [
  'guides',
  'states',
  'regulations',
  'editorial-policy',
  'why-this-exists',
];

const targets = [
  // Shared Astro CSS/assets required by state/city/guide pages.
  { src: path.join(astroRoot, '_astro'), dest: path.join(root, 'dist', '_astro') },
  // Top-level Astro routes that should override SPA catch-all when present.
  ...topLevelAstroRouteDirs.map((dir) => ({
    src: path.join(astroRoot, dir),
    dest: path.join(root, 'dist', dir),
  })),
  // Canonical listing routes now live under /{care-type}/*
  ...careTypeDirs.map((dir) => ({
    src: path.join(astroRoot, dir),
    dest: path.join(root, 'dist', dir),
  }))
];

const createAssetCompatibilityAliases = () => {
  const distRoot = path.join(root, 'dist');
  const indexHtmlPath = path.join(distRoot, 'index.html');
  const assetsDir = path.join(distRoot, 'assets');

  if (!fs.existsSync(indexHtmlPath) || !fs.existsSync(assetsDir)) {
    return;
  }

  const html = fs.readFileSync(indexHtmlPath, 'utf-8');
  const aliases = [
    {
      label: 'index-js',
      alias: 'index.js',
      pattern: /<script[^>]+src="\/assets\/(index-[^"]+\.js)"/,
    },
    {
      label: 'maps-js',
      alias: 'maps.js',
      pattern: /<link[^>]+href="\/assets\/(maps-[^"]+\.js)"/,
    },
    {
      label: 'react-js',
      alias: 'react.js',
      pattern: /<link[^>]+href="\/assets\/(react-[^"]+\.js)"/,
    },
    {
      label: 'supabase-js',
      alias: 'supabase.js',
      pattern: /<link[^>]+href="\/assets\/(supabase-[^"]+\.js)"/,
    },
    {
      label: 'vendor-js',
      alias: 'vendor.js',
      pattern: /<link[^>]+href="\/assets\/(vendor-[^"]+\.js)"/,
    },
    {
      label: 'index-css',
      alias: 'index.css',
      pattern: /<link[^>]+href="\/assets\/(index-[^"]+\.css)"/,
    },
    {
      label: 'maps-css',
      alias: 'maps.css',
      pattern: /<link[^>]+href="\/assets\/(maps-[^"]+\.css)"/,
    },
  ];

  for (const item of aliases) {
    const match = html.match(item.pattern);
    const sourceName = match?.[1];
    if (!sourceName) {
      continue;
    }
    const sourcePath = path.join(assetsDir, sourceName);
    const aliasPath = path.join(assetsDir, item.alias);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }
    fs.copyFileSync(sourcePath, aliasPath);
    console.log('[merge_astro] Alias', item.label, sourceName, '->', item.alias);
  }
};

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

createAssetCompatibilityAliases();
