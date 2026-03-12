import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const astroRoot = path.join(root, 'dist-astro');
const enableStaticSeniorLiving =
  process.env.ENABLE_STATIC_SENIOR_LIVING === '1' ||
  process.env.ENABLE_STATIC_SENIOR_LIVING === 'true';

if (!enableStaticSeniorLiving) {
  console.log('[merge_astro] Skipping static /senior-living copy (runtime route mode).');
}

const targets = [
  // Shared Astro CSS/assets required by state/city/guide pages.
  { src: path.join(astroRoot, '_astro'), dest: path.join(root, 'dist', '_astro') },
  // High-cardinality /senior-living/* pages are served via the React runtime + SPA fallback.
  // Publishing all static variants (city + care-type pages) can exceed Netlify deploy upload limits.
  ...(enableStaticSeniorLiving
    ? [{ src: path.join(astroRoot, 'senior-living'), dest: path.join(root, 'dist', 'senior-living') }]
    : []),
  // Facility detail URLs resolve through the React route under `/senior-living/:state/:city/:leaf`
  // so the full dynamic template renders instead of the static Astro shell.
  { src: path.join(astroRoot, 'guides'), dest: path.join(root, 'dist', 'guides') }
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
