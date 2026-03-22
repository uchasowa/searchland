'use strict';
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const envPath = path.join(repoRoot, 'apps/server/.env');
if (!fs.existsSync(envPath)) {
  console.error('Missing', envPath);
  process.exit(1);
}

require(path.join(repoRoot, 'apps/server/node_modules/dotenv')).config({ path: envPath });
const v = process.env.DATABASE_URL?.trim();
if (!v) {
  console.error('DATABASE_URL is empty in apps/server/.env');
  process.exit(1);
}
process.stdout.write(v);
