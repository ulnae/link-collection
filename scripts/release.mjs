/**
 * 一键发版脚本：同步 package.json 与 manifest.json 的版本号，
 * 提交、打 v* 标签并推送，推送后 GitHub Actions 自动构建并创建 Release。
 *
 * 用法：
 *   npm run release            # 默认 patch（1.0.0 → 1.0.1）
 *   npm run release -- minor   # 1.0.0 → 1.1.0
 *   npm run release -- major   # 1.0.0 → 2.0.0
 *   npm run release -- 1.2.3   # 指定精确版本号
 */
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const git = (args) => execSync(`git ${args}`, { cwd: root, encoding: 'utf8' }).trim();

// 1. 前置检查：工作区必须干净，避免把未提交的改动混进发版提交
if (git('status --porcelain')) {
  console.error('✖ 工作区有未提交的改动，请先 commit 或 stash 后再发版');
  process.exit(1);
}

// 2. 计算新版本号
const pkgPath = resolve(root, 'package.json');
const manifestPath = resolve(root, 'manifest.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const current = pkg.version;

const arg = process.argv[2] ?? 'patch';
let next;
if (/^\d+\.\d+\.\d+$/.test(arg)) {
  next = arg;
} else if (['major', 'minor', 'patch'].includes(arg)) {
  const [ma, mi, pa] = current.split('.').map(Number);
  next =
    arg === 'major' ? `${ma + 1}.0.0`
    : arg === 'minor' ? `${ma}.${mi + 1}.0`
    : `${ma}.${mi}.${pa + 1}`;
} else {
  console.error(`✖ 无效参数 "${arg}"，可用值：major / minor / patch / x.y.z`);
  process.exit(1);
}

if (next === current) {
  console.error(`✖ 新版本号与当前版本相同（${current}）`);
  process.exit(1);
}

// 3. 同步两处版本号
pkg.version = next;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.version = next;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`▶ 版本号 ${current} → ${next}（package.json + manifest.json）`);

// 4. 提交 + 打标签 + 推送
git(`add package.json manifest.json`);
git(`commit -m "release: v${next}"`);
git(`tag v${next}`);
console.log(`▶ 已提交并创建标签 v${next}，推送到 origin ...`);

let r = spawnSync('git', ['push'], { stdio: 'inherit', cwd: root, shell: true });
if (r.status !== 0) process.exit(r.status ?? 1);
r = spawnSync('git', ['push', `origin`, `v${next}`], { stdio: 'inherit', cwd: root, shell: true });
if (r.status !== 0) process.exit(r.status ?? 1);

console.log(`\n✔ 发版完成：标签 v${next} 已推送，GitHub Actions 正在构建并发布 Release。`);
console.log(`  进度：https://github.com/${getRepo()}/actions`);

function getRepo() {
  try {
    const url = git('remote get-url origin');
    return url.replace(/^git@github\.com:/, '').replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
  } catch {
    return '<你的用户名>/link-easy';
  }
}
