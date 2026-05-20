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

async function deepDiagnose() {
  const orderId = 'ORD-6756';
  console.log(`Diagnosing Order: ${orderId}`);

  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (!order) {
    console.error('Order not found');
    return;
  }

  console.log('Order Org ID:', order.organization_id);
  console.log('Order Ref Code:', order.referral_code);
  console.log('Order Status:', order.status);

  if (order.referral_code) {
    const { data: affiliates } = await supabase.from('affiliates')
       .select('*')
       .ilike('referral_code', order.referral_code);
    
    console.log(`Affiliates found for '${order.referral_code}':`, affiliates.length);
    affiliates.forEach(a => {
      console.log(`- ID: ${a.id}, Org ID: ${a.organization_id}, Code: ${a.referral_code}`);
      console.log(`  Match Org: ${a.organization_id === order.organization_id}`);
    });
  }

  const { data: comms } = await supabase.from('commissions').select('*').eq('order_id', orderId);
  console.log('Commissions recorded:', comms.length);
}

deepDiagnose();
