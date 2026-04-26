require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const { rows } = await pool.query(`
    SELECT u.email, u.role, u."tenantId", t.slug as "tenantSlug" 
    FROM users u
    JOIN tenants t ON u."tenantId" = t.id
    WHERE u.role = 'TEACHER'
    ORDER BY u."createdAt" DESC
    LIMIT 5;
  `);
  console.log(JSON.stringify(rows, null, 2));
  pool.end();
}

main().catch(console.error);
