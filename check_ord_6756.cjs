const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n')
  .filter(line => line.includes('='))
  .map(line => {
    const [key, ...val] = line.split('=');
    return [key.trim(), val.join('=').trim().replace(/^"(.*)"$/, '$1')];
  }));

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkOrder(orderId) {
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
  console.log('Order:', JSON.stringify(order, null, 2));

  const { data: commissions } = await supabase.from('commissions').select('*').eq('order_id', orderId);
  console.log('Commissions found:', commissions.length);
  console.log(JSON.stringify(commissions, null, 2));

  if (order.referral_code) {
    const { data: affiliate } = await supabase.from('affiliates').select('*').ilike('referral_code', order.referral_code).maybeSingle();
    console.log('Affiliate found:', JSON.stringify(affiliate, null, 2));
  }
}

checkOrder('ORD-6756');
