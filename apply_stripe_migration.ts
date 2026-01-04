
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function runMigration() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ DATABASE_URL is missing in .env.local');
        process.exit(1);
    }

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }, // For Supabase
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        const sqlPath = path.join(process.cwd(), 'add_stripe_connect.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration...');
        await client.query(sql);
        console.log('✅ Migration successful: stripe_account_id added to restaurants table.');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
