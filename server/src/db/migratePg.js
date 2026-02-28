/**
 * Миграции через pg (node-postgres) — neon-http не поддерживает session,
 * необходимый для drizzle migrator.
 */
require('dotenv').config()
const { Pool } = require('pg')
const { drizzle } = require('drizzle-orm/node-postgres')
const { migrate } = require('drizzle-orm/node-postgres/migrator')
const path = require('path')

async function runMigrations() {
    let connectionString = process.env.DATABASE_URL
    if (connectionString && !connectionString.includes('sslmode=')) {
        connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=require'
    }
    const pool = new Pool({ connectionString })
    const db = drizzle(pool)
    const migrationsFolder = path.join(__dirname, 'migrations')
    await migrate(db, { migrationsFolder })
    await pool.end()
}

if (require.main === module) {
    runMigrations()
        .then(() => console.log('Migrations completed'))
        .catch((err) => {
            console.error('Migration error:', err)
            process.exit(1)
        })
}

module.exports = { runMigrations }
