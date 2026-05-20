const url = "https://clnuievcdnbwqbyqhwys.supabase.co/rest/v1/products";
const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk";

const HEADERS = {
    "apikey": apikey,
    "Authorization": `Bearer ${apikey}`,
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
};

async function cleanDescriptions() {
    console.log("Starting cleaning process...");
    
    // 1. Fetch all products (getting only ID and description)
    const res = await fetch(`${url}?select=id,description`, { headers: HEADERS });
    const products = await res.json();
    
    console.log(`Found ${products.length} products total.`);
    
    const regex = /((<br\s*\/?>|<\/br>)\s*){3,}/gi;
    let updatedCount = 0;
    
    for (const p of products) {
        if (!p.description) continue;
        
        const original = p.description;
        const cleaned = original.replace(regex, '<br/><br/>');
        
        if (cleaned !== original) {
            // console.log(`Cleaning description for product ${p.id}...`);
            const updateRes = await fetch(`${url}?id=eq.${p.id}`, {
                method: 'PATCH',
                headers: HEADERS,
                body: JSON.stringify({ description: cleaned })
            });
            
            if (updateRes.ok) {
                updatedCount++;
            } else {
                console.error(`Failed to update product ${p.id}`);
            }
        }
    }
    
    console.log(`Process complete. Updated ${updatedCount} products.`);
}

cleanDescriptions();
