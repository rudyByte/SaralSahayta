const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
        console.log('Tables found in DB:', res.rows.map(r => r.table_name));
        
        // Also check if any table name contains 'user' or 'User' or 'Application' or 'application'
        const filtered = res.rows.filter(r => 
            r.table_name.toLowerCase().includes('user') || 
            r.table_name.toLowerCase().includes('application') ||
            r.table_name.toLowerCase().includes('scheme')
        );
        console.log('Filtered Tables:', JSON.stringify(filtered, null, 2));

    } catch (err) {
        console.error('Error connecting to DB:', err.message);
    } finally {
        await client.end();
    }
}

main();
