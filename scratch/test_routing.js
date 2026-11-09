import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import router utilities directly
import {
  splitPath,
  normalizePathname,
  normalizePath,
  pathToScreen,
  screenToPath,
  matchPath
} from '../frontend/src/router/routerUtils.js';

console.log('--- STARTING ROUTER & VERCEL CONFIG AUDIT ---');

// 1. Verify Vercel Configuration Files
console.log('\n[1/5] Verifying Vercel SPA Rewrite Configurations:');
const rootVercelPath = path.resolve(__dirname, '../vercel.json');
const frontendVercelPath = path.resolve(__dirname, '../frontend/vercel.json');

assert(fs.existsSync(rootVercelPath), 'Root vercel.json must exist');
assert(fs.existsSync(frontendVercelPath), 'frontend/vercel.json must exist');

const rootVercel = JSON.parse(fs.readFileSync(rootVercelPath, 'utf8'));
const frontendVercel = JSON.parse(fs.readFileSync(frontendVercelPath, 'utf8'));

assert.deepStrictEqual(
  rootVercel.rewrites,
  [{ source: '/(.*)', destination: '/' }],
  'Root vercel.json rewrite must route /(.*) to /'
);
assert.deepStrictEqual(
  frontendVercel.rewrites,
  [{ source: '/(.*)', destination: '/' }],
  'frontend/vercel.json rewrite must route /(.*) to /'
);
console.log('✓ Root vercel.json and frontend/vercel.json both correctly configured for SPA rewrites.');

// 2. Test splitPath
console.log('\n[2/5] Testing splitPath deconstruction:');
const p1 = splitPath('/ledger?category=Food&search=coffee#history');
assert.strictEqual(p1.pathname, '/ledger');
assert.strictEqual(p1.search, '?category=Food&search=coffee');
assert.strictEqual(p1.hash, '#history');

const p2 = splitPath('/budget');
assert.strictEqual(p2.pathname, '/budget');
assert.strictEqual(p2.search, '');
assert.strictEqual(p2.hash, '');

const p3 = splitPath('/profile?tab=security');
assert.strictEqual(p3.pathname, '/profile');
assert.strictEqual(p3.search, '?tab=security');
console.log('✓ splitPath correctly deconstructs paths, queries, and hashes.');

// 3. Test matchPath for dynamic and wildcard routes
console.log('\n[3/5] Testing matchPath routing:');
// Exact match
const m1 = matchPath('/ledger', '/ledger');
assert(m1 && m1.matches, 'Exact match failed');

// Trailing slash invariance
const m2 = matchPath('/ledger', '/ledger/');
assert(m2 && m2.matches, 'Trailing slash normalization failed');

// Dynamic parameters
const m3 = matchPath('/users/:id', '/users/usr_4829');
assert(m3 && m3.matches && m3.params.id === 'usr_4829', 'Dynamic param :id failed');

const m4 = matchPath('/transactions/:category/:id', '/transactions/dining/tx_9981');
assert(
  m4 && m4.matches && m4.params.category === 'dining' && m4.params.id === 'tx_9981',
  'Multi-param matching failed'
);

// Wildcard catch-all
const m5 = matchPath('*', '/some/unknown/nested/route');
assert(m5 && m5.matches, 'Wildcard route failed');

// Mismatch check
const m6 = matchPath('/budget', '/ledger');
assert.strictEqual(m6, null, 'Mismatch check failed');
console.log('✓ matchPath accurately handles exact matches, params extraction, and wildcard fallbacks.');

// 4. Test pathToScreen and screenToPath
console.log('\n[4/5] Testing pathToScreen and screenToPath mapping:');
assert.strictEqual(pathToScreen('/'), 'dashboard');
assert.strictEqual(pathToScreen('/dashboard'), 'dashboard');
assert.strictEqual(pathToScreen('/ledger'), 'ledger');
assert.strictEqual(pathToScreen('/ledger?category=Dining'), 'ledger');
assert.strictEqual(pathToScreen('/budget'), 'budget');
assert.strictEqual(pathToScreen('/profile'), 'profile');
assert.strictEqual(pathToScreen('/login'), 'login');
assert.strictEqual(pathToScreen('/forgot-password'), 'forgot');
assert.strictEqual(pathToScreen('/random-unknown-page'), 'random-unknown-page');

assert.strictEqual(screenToPath('dashboard'), '/dashboard');
assert.strictEqual(screenToPath('ledger'), '/ledger');
assert.strictEqual(screenToPath('/ledger?category=Food'), '/ledger?category=Food');
console.log('✓ Screen and path conversions match canonical definitions.');

// 5. Verify App.jsx wildcard route points to NotFoundPage
console.log('\n[5/5] Verifying App.jsx Route definitions:');
const appJsx = fs.readFileSync(path.resolve(__dirname, '../frontend/src/App.jsx'), 'utf8');
assert(appJsx.includes("NotFoundPage = lazy(() => import('./pages/NotFoundPage'))"), 'NotFoundPage must be lazy loaded');
assert(appJsx.includes('<Route path="*" element={<NotFoundPage />} />'), 'Wildcard route must render NotFoundPage');
assert(!appJsx.includes('<Route path="*" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />'), 'Dashboard wildcard must be removed');
console.log('✓ App.jsx wildcard correctly renders NotFoundPage without silent redirect.');

console.log('\nALL 5 ROUTING TEST SUITES PASSED CLEANLY (100% SUCCESS)!');

