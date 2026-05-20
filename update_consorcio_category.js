import fs from 'fs';
const url = "https://clnuievcdnbwqbyqhwys.supabase.co/rest/v1/products?name=ilike.*Consórcio*";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk";

async function moveConsorcioProducts() {
    try {
        const newCatId = 57;
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                "apikey": serviceRoleKey,
                "Authorization": `Bearer ${serviceRoleKey}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify({ category_id: newCatId })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Update failed: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log(`Successfully updated ${data.length} products to category ID ${newCatId}`);
        fs.writeFileSync('update_results.json', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

moveConsorcioProducts();
