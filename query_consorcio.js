import fs from 'fs';
const url = "https://clnuievcdnbwqbyqhwys.supabase.co/rest/v1/product_categories?select=id,name";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE";

async function checkConsorcio() {
    try {
        const response = await fetch(url, {
            headers: {
                "apikey": anonKey,
                "Authorization": `Bearer ${anonKey}`
            }
        });
        const categories = await response.json();
        fs.writeFileSync('categories_debug.json', JSON.stringify(categories, null, 2));
        console.log("Categories saved to categories_debug.json");

        const searchNameUrl = `https://clnuievcdnbwqbyqhwys.supabase.co/rest/v1/products?name=ilike.*Consórcio*&select=id,name,category_id`;
        const searchNameResponse = await fetch(searchNameUrl, {
            headers: {
                "apikey": anonKey,
                "Authorization": `Bearer ${anonKey}`
            }
        });
        const namedProducts = await searchNameResponse.json();
        fs.writeFileSync('named_products_consorcio.json', JSON.stringify(namedProducts, null, 2));
        console.log("Named products saved to named_products_consorcio.json");
    } catch (error) {
        console.error("Error:", error);
    }
}

checkConsorcio();
