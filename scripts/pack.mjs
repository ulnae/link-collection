/**
 * 本地打包脚本：先完整构建，再把 dist/ 压缩为 link-collection-v{version}.zip
 * 产物即为「加载已解压扩展」可直接使用的目录，与 CI 发版产物一致。
 *
 * 用法：
 *   npm run pack
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'));
if (manifest.version !== version) {
  console.error(`✖ 版本不一致：package.json (${version}) 与 manifest.json (${manifest.version}) 不同，请先统一`);
  process.exit(1);
}

const outZip = resolve(root, `link-collection-v${version}.zip`);
if (existsSync(outZip)) rmSync(outZip);

// 1. 完整构建（图标 + content/background + manifest 拷贝）
console.log('▶ 构建中...');
spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true, cwd: root });
if (!existsSync(resolve(dist, 'manifest.json'))) {
  console.error('✖ 构建失败：dist/manifest.json 不存在');
  process.exit(1);
}

// 2. 压缩 dist/ 为 zip（跨平台：Windows 用 PowerShell，其余用 zip 命令）
console.log(`▶ 压缩 ${basename(outZip)} ...`);
if (process.platform === 'win32') {
  const r = spawnSync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `Compress-Archive -Path (Join-Path '${dist.replace(/'/g, "''")}' '*') -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`
    ],
    { stdio: 'inherit', shell: true }
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
} else {
  const r = spawnSync('zip', ['-r', outZip, '.'], { stdio: 'inherit', cwd: dist });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const size = statSync(outZip).size;
console.log(`✔ 打包完成：${outZip} (${(size / 1024).toFixed(1)} KB)`);
