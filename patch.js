const fs = require('fs');
const file = 'dist/server/wrangler.json';
if (!fs.existsSync(file)) {
  console.error(`File ${file} does not exist. Run build first.`);
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
delete data.legacy_env;
delete data.r2_buckets;
if (data.d1_databases && data.d1_databases.length > 0) {
  data.d1_databases[0].database_id = 'ecf3a60c-d641-4c2b-bfe0-2688e1192550';
  data.d1_databases[0].database_name = 'asia-agency-db';
} else {
  data.d1_databases = [{
    binding: 'DB',
    database_name: 'asia-agency-db',
    database_id: 'ecf3a60c-d641-4c2b-bfe0-2688e1192550'
  }];
}
data.kv_namespaces = [
  {
    binding: 'MEDIA_KV',
    id: '7a7e8972d0d648778170737c4a783909'
  }
];
data.vars = { ...data.vars, ADMIN_PASSWORD: 'asiakhalil@1234' };
fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('Successfully patched dist/server/wrangler.json with DB, MEDIA_KV, and ADMIN_PASSWORD');
