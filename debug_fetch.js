const url = "https://clnuievcdnbwqbyqhwys.supabase.co/rest/v1/affiliates?email=in.(joaquimpai@gmail.com,joaquimfilho@gmail.com)&select=id,email,full_name,sponsor_id,organization_id,referral_code";
const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk";

async function run() {
    try {
        const res = await fetch(url, {
            headers: {
                "apikey": apikey,
                "Authorization": `Bearer ${apikey}`
            }
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

run();
