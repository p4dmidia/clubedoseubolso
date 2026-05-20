
$SUPABASE_URL = "https://clnuievcdnbwqbyqhwys.supabase.co"
$SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

$orderId = "ORD-5331"
Write-Host "Manually testing order $orderId with curl..."

$headers = "-H 'apikey: $SUPABASE_KEY' -H 'Authorization: Bearer $SUPABASE_KEY' -H 'Content-Type: application/json' -H 'Prefer: return=representation'"
$payload = '{\"status\": \"Pago\", \"payment_status\": \"paid\"}'

# Use curl to get the exact raw output
$command = "curl -X PATCH $SUPABASE_URL/rest/v1/orders?id=eq.$orderId $headers -d '$payload'"
Write-Host "Running: $command"
Invoke-Expression $command
