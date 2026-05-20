const url = "https://clnuievcdnbwqbyqhwys.supabase.co/rest/v1/products?select=id,name,description&limit=10";
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
        data.forEach(p => {
            console.log(`Product: ${p.name}`);
            console.log(`Description (first 200 chars): ${p.description ? p.description.substring(0, 200) : "empty"}`);
            // Check for tags
            const matches = p.description ? p.description.match(/<br.*?>|<\/br>/gi) : [];
            if (matches) {
                console.log(`Found ${matches.length} tags: ${matches.slice(0, 5).join(' ')}...`);
            }
            console.log("--------------------");
        });
    } catch (e) {
        console.error(e);
    }
}

run();
