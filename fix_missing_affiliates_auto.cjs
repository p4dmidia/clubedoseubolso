const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fix() {
    // 1. Get all profiles
    const { data: profiles, error: pErr } = await supabase.from('user_profiles').select('*');
    if (pErr) return console.error(pErr);
    
    // 2. Get all affiliates
    const { data: affiliates, error: aErr } = await supabase.from('affiliates').select('*');
    if (aErr) return console.error(aErr);

    const affiliateUserIds = new Set(affiliates.map(a => a.user_id));
    
    const missingProfiles = profiles.filter(p => !affiliateUserIds.has(p.id));
    console.log(`Found ${missingProfiles.length} profiles missing from affiliates.`);
    
    for (const p of missingProfiles) {
        console.log(`Fixing ${p.email}...`);
        const res = await supabase.from('affiliates').insert({
            user_id: p.id,
            email: p.email,
            full_name: p.full_name,
            referral_code: p.login || p.email.split('@')[0],
            whatsapp: p.whatsapp,
            cpf: p.cpf,
            cnpj: p.cnpj,
            organization_id: p.organization_id,
            sponsor_id: null, // Default
            is_active: true,
            created_at: p.created_at,
            updated_at: p.updated_at
        });
        if (res.error) console.error(`Error fixing ${p.email}:`, res.error);
        else console.log(`Fixed ${p.email}`);
    }
}
fix();
