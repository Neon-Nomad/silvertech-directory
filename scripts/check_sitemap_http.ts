import fs from 'node:fs';
import path from 'node:path';

type CheckResult = {
  url: string;
  status: number;
  finalUrl: string;
  redirects: number;
};

const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');

if (!fs.existsSync(sitemapPath)) {
  console.error(`Missing sitemap at ${sitemapPath}`);
  process.exit(1);
}

const extractLocs = (xmlContent: string) =>
  [...xmlContent.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

const readLocalSitemap = (locUrl: string) => {
  const fileName = locUrl.split('/').pop();
  if (!fileName) return null;
  const localPath = path.join(process.cwd(), 'public', fileName);
  if (!fs.existsSync(localPath)) {
    console.error(`Missing referenced sitemap file: ${localPath}`);
    process.exit(1);
  }
  return fs.readFileSync(localPath, 'utf-8');
};

const gatherUrls = () => {
  const rootXml = fs.readFileSync(sitemapPath, 'utf-8');
  const urls: string[] = [];

  const walk = (xmlContent: string) => {
    if (xmlContent.includes('<sitemapindex')) {
      for (const loc of extractLocs(xmlContent)) {
        const childXml = readLocalSitemap(loc);
        if (childXml) walk(childXml);
      }
      return;
    }

    urls.push(...extractLocs(xmlContent));
  };

  walk(rootXml);
  return urls;
};

const shuffle = (list: string[]) => {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const follow = async (url: string, maxRedirects = 3): Promise<CheckResult> => {
  let current = url;
  let redirects = 0;
  let status = 0;

  while (redirects <= maxRedirects) {
    const response = await fetch(current, { method: 'GET', redirect: 'manual' });
    status = response.status;
    if (status >= 300 && status < 400) {
      const location = response.headers.get('location');
      if (!location) break;
      current = location.startsWith('http') ? location : new URL(location, current).toString();
      redirects += 1;
      continue;
    }
    break;
  }

  return { url, status, finalUrl: current, redirects };
};

const main = async () => {
  const urls = gatherUrls();
  const sampleSize = Number(process.env.SAMPLE || 50);
  const targets = shuffle([...urls]).slice(0, Math.min(sampleSize, urls.length));

  console.log(`Checking ${targets.length} URLs (sample of ${urls.length})...`);

  const results: CheckResult[] = [];
  for (const url of targets) {
    try {
      results.push(await follow(url));
    } catch (error) {
      results.push({ url, status: 0, finalUrl: url, redirects: 0 });
    }
  }

  const failures = results.filter((r) => r.status !== 200);
  const redirected = results.filter((r) => r.redirects > 0);

  console.log(`200 OK: ${results.length - failures.length}`);
  console.log(`Non-200: ${failures.length}`);
  console.log(`Redirects: ${redirected.length}`);

  if (failures.length) {
    console.log('Sample failures:');
    failures.slice(0, 10).forEach((r) => {
      console.log(`- ${r.status} ${r.url} -> ${r.finalUrl} (${r.redirects} redirects)`);
    });
    process.exit(1);
  }
};

main().catch((err) => {
  console.error('Sitemap HTTP check failed:', err);
  process.exit(1);
});
