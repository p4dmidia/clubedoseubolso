
# Supabase Configuration
$SUPABASE_URL = "https://clnuievcdnbwqbyqhwys.supabase.co"
$SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

$headers = @{
    "apikey" = $SUPABASE_KEY
    "Authorization" = "Bearer $SUPABASE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation" # We want to see the error or the result
}

Write-Host "Finding a pending order..."
$res = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/orders?status=eq.Pendente&limit=1" -Method Get -Headers $headers

if (-not $res) {
    Write-Host "No 'Pendente' orders. Trying 'pending'..."
    $res = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/orders?status=eq.pending&limit=1" -Method Get -Headers $headers
}

if (-not $res) {
    Write-Host "No pending orders found."
    exit
}

$order = $res[0]
$orderId = $order.id
Write-Host "Found order: $orderId (Status: $($order.status))"

Write-Host "Attempting to update order $orderId to 'Pago'..."
$payload = @{
    "status" = "Pago"
    "payment_status" = "paid"
    "payment_status_detail" = "Accreditated Manual (Debug PowerShell)"
} | ConvertTo-Json

try {
    $updateRes = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/orders?id=eq.$orderId" -Method Patch -Headers $headers -Body $payload
    Write-Host "SUCCESS: Order updated!"
    Write-Host ($updateRes | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "!!! ERROR DETECTED !!!"
    $errorStream = $_.Exception.Response.GetResponseStream()
    if ($errorStream) {
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "PostgREST Error Response:"
        Write-Host $errorBody
    } else {
        Write-Host "Error: $($_.Exception.Message)"
    }
}
