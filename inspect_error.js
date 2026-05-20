
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://clnuievcdnbwqbyqhwys.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function runTrace() {
  // 1. Find a sample pending order
  const { data: orders } = await supabase.from('orders').select('id, status').or('status.eq.Pendente,status.eq.pending').limit(1)
  
  if (!orders || orders.length === 0) {
    console.log("No pending orders found.")
    return
  }

  const orderId = orders[0].id
  console.log(`Triggering update for order: ${orderId}`)

  // 2. Perform the update (to Status 'Pago')
  const { error: updateError } = await supabase
    .from('orders')
    .update({ 
        status: 'Pago',
        payment_status: 'paid'
    })
    .eq('id', orderId)

  if (updateError) {
    console.log("!!! UPDATE FAILED as expected !!!")
    console.log(JSON.stringify(updateError, null, 2))
  } else {
    console.log("SUCCESS: Update worked? That's strange if it supposedly fails.")
  }

  // 3. Read the logs
  console.log("\nReading debug_logs...")
  const { data: logs } = await supabase
    .from('debug_logs')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (logs && logs.length > 0) {
    console.log("TRACE LOGS FOUND:")
    logs.forEach(log => {
      console.log(`[${log.created_at}] Step: ${log.step} | Msg: ${log.error_message || 'N/A'}`)
      if (log.data) console.log(`   Data: ${JSON.stringify(log.data)}`)
    })
  } else {
    console.log("No logs found for this order. This means the trigger didn't even start or the transaction rolled back logs? (In Postgres, if transaction rolls back, logs in the same DB also roll back UNLESS they are external).")
    console.log("Wait, if logs roll back, I should use RAISE NOTICE or a separate mechanism. But I used SECURITY DEFINER trigger.")
  }
}

runTrace()
