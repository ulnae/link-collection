/**
 * 从 assets/icon.svg 生成插件所需各尺寸 PNG 图标
 * 用法：npm run icons
 */
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)) + '/..';
const svg = readFileSync(resolve(root, 'assets/icon.svg'), 'utf8');

const sizes = [16, 32, 48, 128];
for (const size of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    shapeRendering: 'geometricPrecision'
  });
  const out = resolve(root, `assets/icon-${size}.png`);
  writeFileSync(out, resvg.render().asPng());
  console.log(`generated assets/icon-${size}.png`);
}
