const { createClient } = require('@supabase/supabase-js');

const url = "https://clnuievcdnbwqbyqhwys.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk";
const supabase = createClient(url, key);

async function checkReferral() {
    const emails = ['joaquimpai@gmail.com', 'joaquimfilho@gmail.com'];
    
    console.log("--- Affiliates Check ---");
    const { data: affiliates, error } = await supabase
        .from('affiliates')
        .select('id, email, full_name, sponsor_id, organization_id, referral_code')
        .in('email', emails);
    
    if (error) {
        console.error("Error fetching affiliates:", error);
        return;
    }

    if (affiliates && affiliates.length > 0) {
        affiliates.forEach(aff => {
            console.log(`ID: ${aff.id}`);
            console.log(`Email: ${aff.email}`);
            console.log(`Name: ${aff.full_name}`);
            console.log(`Code: ${aff.referral_code}`);
            console.log(`Sponsor ID: ${aff.sponsor_id}`);
            console.log(`Org ID: ${aff.organization_id}`);
            console.log("--------------------");
        });
    } else {
        console.log("No affiliates found for these emails.");
    }

    console.log("\n--- Organization Reference ---");
    const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('name', 'Classe A');
    console.log(orgs);
}

checkReferral();
