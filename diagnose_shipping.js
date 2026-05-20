const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  console.log('--- Checking Product Data ---');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, weight, length, width, height, origin_zip, price')
    .limit(5);

  if (productsError) {
    console.error('Error fetching products:', productsError);
    return;
  }

  products.forEach(p => {
    console.log(`Product: ${p.name} (ID: ${p.id})`);
    console.log(`  Weight: ${p.weight}, L: ${p.length}, W: ${p.width}, H: ${p.height}`);
    console.log(`  Origin ZIP: ${p.origin_zip || 'Not Set (Fallback will be used)'}`);
    
    if (!p.weight || !p.length || !p.width || !p.height) {
      console.warn('  [WARNING] Missing dimensions/weight!');
    }
  });

  if (products.length > 0) {
    console.log('\n--- Testing calculate-shipping Edge Function ---');
    const testZip = '80010010'; // Curitiba
    const testItems = [{ id: products[0].id, quantity: 1 }];

    try {
      const { data, error } = await supabase.functions.invoke('calculate-shipping', {
        body: { zip: testZip, items: testItems }
      });

      if (error) {
        console.error('Edge Function Error:', error);
      } else {
        console.log('Edge Function Success Response:', JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error('Invocation failed:', err);
    }
  }
}

diagnose();
