import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        return NextResponse.json({ error: 'DATABASE_URL not found' }, { status: 500 });
    }

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
    });

    try {
        await client.connect();

        // SQL to add columns
        const sql = `
      ALTER TABLE restaurants 
      ADD COLUMN IF NOT EXISTS tse_tss_id TEXT,
      ADD COLUMN IF NOT EXISTS tse_client_id TEXT;
    `;

        await client.query(sql);

        return NextResponse.json({ success: true, message: 'TSE columns added successfully!' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await client.end();
    }
}
