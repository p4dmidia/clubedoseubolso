
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://clnuievcdnbwqbyqhwys.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testSpecificOrder(orderId) {
  console.log(`\n--- Testing Specific Order: ${orderId} ---`)
  
  // Revert first to be sure it's pending
  await supabase.from('orders').update({ status: 'Pendente', payment_status: 'pending' }).eq('id', orderId)

  const { data, error } = await supabase
    .from('orders')
    .update({ 
        status: 'Pago',
        payment_status: 'paid'
    })
    .eq('id', orderId)
    .select()

  if (error) {
    console.log("!!! ERROR DETECTED !!!")
    console.log(JSON.stringify(error, null, 2))
  } else {
    console.log("SUCCESS: Order updated!")
    console.log(JSON.stringify(data, null, 2))
  }
}

async function run() {
    await testSpecificOrder("#ORD-5331")
    await testSpecificOrder("#ORD-6061")
    await testSpecificOrder("#ORD-7640")
}

run()
