import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function applyMigration() {
    const sqlPath = path.join(process.cwd(), 'add_tse_ids.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying migration: add_tse_ids.sql');

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error("DATABASE_URL is missing in .env.local");
        process.exit(1);
    }

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false } // Supabase requires SSL, usually self-signed handling needed or this
    });

    try {
        await client.connect();
        console.log("Connected to database.");
        await client.query(sql);
        console.log("Migration applied successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

applyMigration();
