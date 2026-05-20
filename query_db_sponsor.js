const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?order=created_at.desc&limit=1`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    console.log('--- LATEST PROFILE ---');
    console.log(JSON.stringify(await res.json(), null, 2));

    const res2 = await fetch(`${SUPABASE_URL}/rest/v1/affiliates?order=created_at.desc&limit=1`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    console.log('--- LATEST AFFILIATE ---');
    console.log(JSON.stringify(await res2.json(), null, 2));
}
test();
