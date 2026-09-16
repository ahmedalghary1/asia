const fs = require('fs');
const file = 'dist/server/wrangler.json';
const data = JSON.parse(fs.readFileSync(file));
delete data.legacy_env;
delete data.r2_buckets;
data.d1_databases[0].database_id = 'ecf3a60c-d641-4c2b-bfe0-2688e1192550';
fs.writeFileSync(file, JSON.stringify(data));
