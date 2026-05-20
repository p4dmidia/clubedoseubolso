import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Simple .env.local parser
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables in .env.local.');
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

  if (products.length === 0) {
    console.log('No products found in the database.');
    return;
  }

  products.forEach(p => {
    console.log(`Product: ${p.name} (ID: ${p.id})`);
    console.log(`  Weight: ${p.weight}, L: ${p.length}, W: ${p.width}, H: ${p.height}`);
    console.log(`  Origin ZIP: ${p.origin_zip || 'Not Set (Fallback: 82820-160)'}`);
    
    if (!p.weight || !p.length || !p.width || !p.height) {
      console.warn('  [WARNING] Missing dimensions/weight!');
    }
  });

  console.log('\n--- Testing calculate-shipping Edge Function ---');
  // Test with a set of dummy items (first 2 products)
  const testZip = '80010010'; // Curitiba
  const testItems = products.map(p => ({ id: p.id, quantity: 1 }));

  console.log(`Calling function with ZIP: ${testZip} and ${testItems.length} items...`);
  
  try {
    const { data, error } = await supabase.functions.invoke('calculate-shipping', {
      body: { zip: testZip, items: testItems }
    });

    if (error) {
      console.error('Edge Function Error:', error);
      // Try to get more details if it's a 500 error
      if (error.message) console.log('Error Message:', error.message);
    } else {
      console.log('Edge Function Success Response:', JSON.stringify(data, null, 2));
      if (data.length === 0) {
        console.warn('  [WARNING] Function returned an empty array. This triggers the UI error message.');
      }
    }
  } catch (err) {
    console.error('Invocation failed:', err);
  }
}

diagnose();
