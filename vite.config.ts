import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { copyFileSync, mkdirSync, cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: {
      input: resolve(__dirname, 'src/content.ts'),
      output: {
        entryFileNames: 'link-easy.content.js',
        format: 'iife'
      }
    }
  },
  plugins: [
    {
      name: 'copy-manifest',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        mkdirSync(distDir, { recursive: true });
        copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(distDir, 'manifest.json')
        );
        mkdirSync(resolve(distDir, 'assets'), { recursive: true });
        for (const size of [16, 32, 48, 128]) {
          copyFileSync(
            resolve(__dirname, `assets/icon-${size}.png`),
            resolve(distDir, `assets/icon-${size}.png`)
          );
        }
      }
    }
  ]
});
