import sharp from 'sharp';
import path from 'path';

const IMAGES_DIR = path.resolve('public/images');
const SOURCE = path.join(IMAGES_DIR, 'hero_image.png');

const VARIANTS = [
  { width: 640, suffix: '-640w' },
  { width: 960, suffix: '-960w' },
];

const FORMATS: Array<{ ext: string; options: Parameters<sharp.Sharp['avif']>[0] | Parameters<sharp.Sharp['webp']>[0]; method: 'avif' | 'webp' }> = [
  { ext: 'avif', options: { quality: 50 }, method: 'avif' },
  { ext: 'webp', options: { quality: 75 }, method: 'webp' },
];

async function main() {
  for (const variant of VARIANTS) {
    for (const format of FORMATS) {
      const outName = `hero_image${variant.suffix}.${format.ext}`;
      const outPath = path.join(IMAGES_DIR, outName);
      await sharp(SOURCE)
        .resize(variant.width)
        [format.method](format.options as any)
        .toFile(outPath);
      console.log(`Created ${outName}`);
    }
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
