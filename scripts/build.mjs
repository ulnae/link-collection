/**
 * Link Collection 构建脚本
 * 分别以 IIFE 格式打包 content 脚本与 background service worker，
 * 并将 manifest.json 与插件图标拷贝到 dist/
 *
 * 用法：
 *   node scripts/build.mjs          # 单次构建
 *   node scripts/build.mjs --watch  # 监听模式
 */
import { build } from 'vite';
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const watch = process.argv.includes('--watch');

function copyAssets() {
  mkdirSync(resolve(dist, 'assets'), { recursive: true });
  copyFileSync(
    resolve(root, 'manifest.json'),
    resolve(dist, 'manifest.json')
  );
  for (const size of [16, 32, 48, 128]) {
    copyFileSync(
      resolve(root, `assets/icon-${size}.png`),
      resolve(dist, `assets/icon-${size}.png`)
    );
  }
}

const copyPlugin = {
  name: 'copy-manifest-and-icons',
  closeBundle: copyAssets
};

const common = {
  configFile: false,
  root,
  plugins: [copyPlugin],
  logLevel: 'info'
};

// 1. content 脚本（注入页面的主逻辑）
await build({
  ...common,
  build: {
    outDir: dist,
    emptyOutDir: true,
    target: 'es2020',
    watch,
    rollupOptions: {
      input: resolve(root, 'src/content.ts'),
      output: {
        entryFileNames: 'content.js',
        format: 'iife',
        inlineDynamicImports: true
      }
    }
  }
});

// 2. background service worker（chrome.downloads 下载）
await build({
  ...common,
  build: {
    outDir: dist,
    emptyOutDir: false,
    target: 'es2020',
    watch,
    rollupOptions: {
      input: resolve(root, 'src/background.ts'),
      output: {
        entryFileNames: 'background.js',
        format: 'iife',
        inlineDynamicImports: true
      }
    }
  }
});
