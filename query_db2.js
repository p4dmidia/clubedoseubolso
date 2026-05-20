const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/debug_logs?order=created_at.desc&limit=5`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    console.log(await res.json());
}
test();
