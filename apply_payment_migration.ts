import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import { Client } from 'pg';

dotenv.config({ path: '.env.local' });

async function applyMigration() {
    console.log("Applying Migration: add_payment_method.sql");
    const sql = fs.readFileSync('add_payment_method.sql', 'utf8');

    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
        try {
            const client = new Client({
                connectionString: dbUrl,
                ssl: { rejectUnauthorized: false }
            });
            await client.connect();
            await client.query(sql);
            await client.end();
            console.log("✅ Migration applied successfully via Direct DB Connection.");
            return;
        } catch (err: any) {
            console.error("⚠️ Failed with direct connection:", err.message);
        }
    }

    console.log("⚠️ Could not apply migration automatically. Please run manually.");
}

applyMigration();
