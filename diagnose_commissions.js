import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Manually parse .env.local because dotenv might not find it
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n')
  .filter(line => line.includes('='))
  .map(line => {
    const [key, ...val] = line.split('=');
    return [key.trim(), val.join('=').trim().replace(/^"(.*)"$/, '$1')];
  }));

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('--- 5 Últimos Pedidos ---');
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('id, status, referral_code, customer_name, total_amount, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (orderError) {
    console.error('Error fetching orders:', orderError);
    return;
  }
  console.table(orders);

  const orderIds = orders.map(o => o.id);
  
  console.log('\n--- Comissões Registradas para estes Pedidos ---');
  const { data: commissions, error: commError } = await supabase
    .from('commissions')
    .select('*')
    .in('order_id', orderIds);

  if (commError) {
    console.error('Error fetching commissions:', commError);
  } else {
    console.table(commissions);
  }

  const referralCodes = orders.filter(o => o.referral_code).map(o => o.referral_code);
  if (referralCodes.length > 0) {
    console.log('\n--- Afiliados Correspondentes ---');
    const { data: affiliates, error: affError } = await supabase
      .from('affiliates')
      .select('id, referral_code, user_id, full_name, sponsor_id')
      .in('referral_code', referralCodes);

    if (affError) {
      console.error('Error fetching affiliates:', affError);
    } else {
      console.table(affiliates);
    }
  }
}

diagnose();
