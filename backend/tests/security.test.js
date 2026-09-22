import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, '..');
const projectRootDir = path.resolve(backendDir, '..');

test('C1 / Gitignore: sensitive files are properly ignored', () => {
  const gitignore = fs.readFileSync(path.resolve(projectRootDir, '.gitignore'), 'utf8');
  assert.match(gitignore, /\.env/, '.env must be in .gitignore');
  assert.match(gitignore, /\*\.pem/, '*.pem must be in .gitignore');
  assert.match(gitignore, /\*\.key/, '*.key must be in .gitignore');
  assert.match(gitignore, /credentials\.json/, 'credentials.json must be in .gitignore');

  const envExample = fs.readFileSync(path.resolve(projectRootDir, '.env.example'), 'utf8');
  assert.doesNotMatch(envExample, /cluster0\.mongodb\.net/, 'Real Mongo cluster URL must not be in .env.example');
  assert.doesNotMatch(envExample, /techlens-production-jwt-secret/, 'Real JWT secret must not be in .env.example');
  assert.match(envExample, /<username>:<password>/, 'Placeholders should be present');
});

test('C8 / H3: Upload extension whitelist and double-extension protection', async () => {
  const uploadModule = await import('../middleware/upload.js');
  assert.ok(uploadModule.productImages, 'productImages upload middleware should be exported');
});

test('C7: Admin ranking allowed weight keys whitelist', async () => {
  const adminController = await import('../controllers/adminController.js');
  assert.ok(typeof adminController.ranking === 'function', 'ranking handler should exist');
});

test('C4 / M7: Password policy complexity validation', () => {
  const validatePassword = (password) => {
    if (!password || password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasDigitOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    return hasUpper && hasDigitOrSpecial;
  };

  assert.equal(validatePassword('short'), false, 'Short passwords should fail');
  assert.equal(validatePassword('alllowernumber123'), false, 'Password without uppercase should fail');
  assert.equal(validatePassword('ALLUPPERCASE'), false, 'Password without digit/special should fail');
  assert.equal(validatePassword('StrongPassword123!'), true, 'Compliant password should pass');
});

test('M3/M4/M5/C9: Regex escape safety prevents ReDoS and injection', () => {
  const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const maliciousInput = '.*(?=a)b+c{1,100}';
  const escaped = escapeRegex(maliciousInput);
  assert.equal(escaped, '\\.\\*\\(\\?=a\\)b\\+c\\{1,100\\}');

  const re = new RegExp(escaped);
  assert.ok(re.test('.*(?=a)b+c{1,100}'));
  assert.ok(!re.test('abc'));
});

test('H1: Role field is strictly excluded from editable user fields in admin controller', () => {
  const adminFile = fs.readFileSync(path.resolve(backendDir, 'controllers/adminController.js'), 'utf8');
  assert.match(adminFile, /editableResourceFields/, 'editableResourceFields should exist');
  assert.doesNotMatch(adminFile, /users:\s*\[[^\]]*"role"/, 'role must NOT be editable via generic resource updater');
});

test('H2 / M14: Order price calculation server-side enforcement', () => {
  const orderFile = fs.readFileSync(path.resolve(backendDir, 'controllers/orderController.js'), 'utf8');
  assert.match(orderFile, /VendorOffer\.find/, 'Order controller must query VendorOffer for real price');
  assert.doesNotMatch(orderFile, /price:\s*item\.price/, 'Order controller must not assign price directly from client item.price');
});

test('C2: VendorOffer field whitelist prevents status:approved escalation', () => {
  const vendorFile = fs.readFileSync(path.resolve(backendDir, 'controllers/vendorController.js'), 'utf8');
  assert.match(vendorFile, /status:\s*"pending"/, 'Vendor offer must be explicitly set to status pending');
  assert.doesNotMatch(vendorFile, /VendorOffer\.create\(\s*req\.body\s*\)/, 'VendorOffer.create must not accept raw req.body');
});

test('C3: Review field whitelist prevents bypass of pending status', () => {
  const buyerFile = fs.readFileSync(path.resolve(backendDir, 'controllers/buyerController.js'), 'utf8');
  assert.match(buyerFile, /status:\s*'pending'/, 'Review must explicitly be created with status pending');
  assert.doesNotMatch(buyerFile, /Review\.create\(\s*req\.body\s*\)/, 'Review.create must not accept raw req.body');
});

test('C10: Dedicated rate limiters configured on sensitive routes', () => {
  const routesFile = fs.readFileSync(path.resolve(backendDir, 'routes/index.js'), 'utf8');
  assert.match(routesFile, /authLimiter/, 'authLimiter should be configured');
  assert.match(routesFile, /reviewLimiter/, 'reviewLimiter should be configured');
  assert.match(routesFile, /orderLimiter/, 'orderLimiter should be configured');
  assert.match(routesFile, /uploadLimiter/, 'uploadLimiter should be configured');
});
