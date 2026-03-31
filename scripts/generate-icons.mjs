import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const resRoot = path.join(root, 'android', 'app', 'src', 'main', 'res');

const densities = {
  mdpi: { legacy: 48, foreground: 108 },
  hdpi: { legacy: 72, foreground: 162 },
  xhdpi: { legacy: 96, foreground: 216 },
  xxhdpi: { legacy: 144, foreground: 324 },
  xxxhdpi: { legacy: 192, foreground: 432 }
};

const legacySource = path.join(root, 'src', 'assets', 'logo-symbol.svg');
const foregroundSource = path.join(root, 'src', 'assets', 'icon-foreground.svg');
const backgroundColor = '#071429';

async function render(source, size, output) {
  await sharp(source)
    .resize(size, size)
    .png()
    .toFile(output);
}

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function writeAdaptiveXml() {
  const anydpiDir = path.join(resRoot, 'mipmap-anydpi-v26');
  const valuesDir = path.join(resRoot, 'values');
  await ensureDir(anydpiDir);
  await ensureDir(valuesDir);

  const launcherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;

  const backgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${backgroundColor}</color>
</resources>
`;

  await writeFile(path.join(anydpiDir, 'ic_launcher.xml'), launcherXml, 'utf8');
  await writeFile(path.join(anydpiDir, 'ic_launcher_round.xml'), launcherXml, 'utf8');
  await writeFile(path.join(valuesDir, 'ic_launcher_background.xml'), backgroundXml, 'utf8');
}

async function writeIcons() {
  for (const [density, sizes] of Object.entries(densities)) {
    const dir = path.join(resRoot, `mipmap-${density}`);
    await ensureDir(dir);
    await render(legacySource, sizes.legacy, path.join(dir, 'ic_launcher.png'));
    await render(legacySource, sizes.legacy, path.join(dir, 'ic_launcher_round.png'));
    await render(foregroundSource, sizes.foreground, path.join(dir, 'ic_launcher_foreground.png'));
  }

  const publicDir = path.join(root, 'public');
  await ensureDir(publicDir);
  await render(legacySource, 512, path.join(publicDir, 'app-icon.png'));
}

async function main() {
  await ensureDir(resRoot);
  await writeAdaptiveXml();
  await writeIcons();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
