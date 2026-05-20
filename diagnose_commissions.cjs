const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Manually parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n')
  .filter(line => line.includes('='))
  .map(line => {
    const [key, ...val] = line.split('=');
    return [key.trim(), val.join('=').trim().replace(/^"(.*)"$/, '$1')];
  }));

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('--- Order Details ---');
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('id, status, referral_code, customer_name, total_amount, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (orderError) {
    console.error('Error fetching orders:', orderError);
    return;
  }
  console.log(JSON.stringify(orders, null, 2));

  const orderIds = orders.map(o => o.id);
  
  console.log('\n--- Commissions ---');
  const { data: commissions, error: commError } = await supabase
    .from('commissions')
    .select('*')
    .in('order_id', orderIds);

  if (commError) {
    console.error('Error fetching commissions:', commError);
  } else {
    console.log(JSON.stringify(commissions, null, 2));
  }

  const referralCodes = orders.map(o => o.referral_code).filter(Boolean);
  if (referralCodes.length > 0) {
    console.log('\n--- Affiliates ---');
    const { data: affiliates, error: affError } = await supabase
      .from('affiliates')
      .select('id, referral_code, user_id, full_name, sponsor_id')
      .in('referral_code', referralCodes);

    if (affError) {
      console.error('Error fetching affiliates:', affError);
    } else {
      console.log(JSON.stringify(affiliates, null, 2));
    }
  }
}

diagnose();
