const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Optional CLI script to execute schema.sql and seed.sql manually.
 * NOTE: This is NEVER executed on server startup.
 */
async function initDb() {
  console.log('--- Initializing Database from schema.sql & seed.sql ---');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const seedPath = path.join(__dirname, '..', 'seed.sql');

    console.log(`Reading schema from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema.sql...');
    await connection.query(schemaSql);
    console.log('Schema created successfully.');

    console.log(`Reading seed from: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing seed.sql...');
    await connection.query(seedSql);
    console.log('Seed data inserted successfully.');

    console.log('--- Database initialization complete! ---');
  } catch (error) {
    console.error('Error during database initialization:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  initDb();
}
