import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'cmd /c npm run build' : 'npm run build';

console.log('==> Step 1: Building project...');
execSync(npmCmd, { cwd: root, stdio: 'inherit' });

console.log('==> Step 2: Patching wrangler.json...');
execSync('node patch.cjs', { cwd: root, stdio: 'inherit' });

console.log('==> Step 3: Deploying to Cloudflare...');
execSync('node ./node_modules/wrangler/bin/wrangler.js deploy --config dist/server/wrangler.json', { cwd: root, stdio: 'inherit' });

console.log('==> Deployment complete!');
