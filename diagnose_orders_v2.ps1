
# Supabase Configuration
$SUPABASE_URL = "https://clnuievcdnbwqbyqhwys.supabase.co"
$SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

$headers = @{
    "apikey" = $SUPABASE_KEY
    "Authorization" = "Bearer $SUPABASE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

Write-Host "`n--- STARTING DEEP DIAGNOSIS ---" -ForegroundColor Cyan

# 1. Check Commission Config
Write-Host "1. Checking commission_configs..." -ForegroundColor Yellow
try {
    $configs = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/commission_configs?key=eq.geral" -Method Get -Headers $headers
    if ($configs) {
        Write-Host "Commission Config 'geral' found:"
        Write-Host ($configs[0] | ConvertTo-Json -Depth 5)
    } else {
        Write-Host "!!! WARNING: Commission config 'geral' NOT FOUND !!!" -ForegroundColor Red
    }
} catch {
    Write-Host "Error fetching commission_configs: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Check for failing orders
Write-Host "`n2. Checking for failing order updates (Testing up to 5 orders)..." -ForegroundColor Yellow
$pendingOrders = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/orders?status=eq.Pendente&limit=5&order=created_at.desc" -Method Get -Headers $headers

if ($pendingOrders.Count -eq 0) {
     $pendingOrders = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/orders?status=eq.pending&limit=5&order=created_at.desc" -Method Get -Headers $headers
}

if ($pendingOrders.Count -eq 0) {
    Write-Host "No pending orders found to test." -ForegroundColor Gray
} else {
    foreach ($order in $pendingOrders) {
        $orderId = $order.id
        Write-Host "`nTesting Order: $orderId (Customer: $($order.customer_name), Referral: $($order.referral_code))" -ForegroundColor Cyan
        
        $payload = @{
            "status" = "Pago"
            "payment_status" = "paid"
            "payment_status_detail" = "Accreditated Manual (DIAGNOSTIC TEST)"
        } | ConvertTo-Json

        try {
            # Attempt to update
            $updateRes = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/orders?id=eq.$orderId" -Method Patch -Headers $headers -Body $payload
            Write-Host "SUCCESS: Order $orderId updated to 'Pago'." -ForegroundColor Green
            
            # Revert to Pendente for the user
             $revertPayload = @{"status" = $order.status; "payment_status" = "pending"} | ConvertTo-Json
             $null = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/orders?id=eq.$orderId" -Method Patch -Headers $headers -Body $revertPayload
             Write-Host "Reverted order $orderId to original status." -ForegroundColor Gray
        } catch {
            Write-Host "!!! FAILURE DETECTED on Order $orderId !!!" -ForegroundColor Red
            $errorStream = $_.Exception.Response.GetResponseStream()
            if ($errorStream) {
                $reader = New-Object System.IO.StreamReader($errorStream)
                $errorBody = $reader.ReadToEnd()
                Write-Host "PostgREST Error Detail:" -ForegroundColor Red
                Write-Host $errorBody -ForegroundColor White
            } else {
                Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
            }
            # Break on first failure to analyze
            # break 
        }
    }
}

Write-Host "`n--- DIAGNOSIS COMPLETE ---" -ForegroundColor Cyan
