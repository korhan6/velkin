// Scans public/photos and writes src/lib/photos.generated.json ({ "services/robotics": "/photos/services/robotics.jpg", ... }).
// Runs automatically before `dev` and `build`. File name (without extension) = slot key.
import { readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = join(root, 'public', 'photos');
const EXT = ['.avif', '.webp', '.jpg', '.jpeg', '.png', '.mp4', '.webm'];
const out = {};

const walk = (d) => {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (EXT.includes(extname(name).toLowerCase())) {
      const rel = relative(dir, p).split(sep).join('/');
      const ext = extname(rel).toLowerCase();
      const key = rel.slice(0, -ext.length).toLowerCase() + (ext === '.mp4' || ext === '.webm' ? ext : '');
      out[key] ??= `/photos/${rel}`;
    }
  }
};
if (existsSync(dir)) walk(dir);
mkdirSync(join(root, 'src', 'lib'), { recursive: true });
writeFileSync(join(root, 'src', 'lib', 'photos.generated.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`photos: ${Object.keys(out).length} file(s) found in public/photos`);
