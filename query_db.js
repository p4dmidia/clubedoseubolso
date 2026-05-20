const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?order=created_at.desc&limit=3`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    console.log('--- PROFILES ---');
    console.log(await res.json());

    const res2 = await fetch(`${SUPABASE_URL}/rest/v1/affiliates?order=created_at.desc&limit=3`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    console.log('--- AFFILIATES ---');
    console.log(await res2.json());
}
test();
