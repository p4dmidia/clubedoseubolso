$url = "https://clnuievcdnbwqbyqhwys.supabase.co"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE"

$headers = @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
}

Write-Host "--- BUSCANDO AFILIADO 'mariafran' ---"
try {
    # Busca por mariafran independentemente de caixa
    $res = Invoke-RestMethod -Uri "$url/rest/v1/affiliates?select=id,full_name,referral_code,organization_id" -Method Get -Headers $headers
    $target = $res | Where-Object { $_.referral_code -ieq "mariafran" }
    if ($target) {
        $target | ForEach-Object {
            Write-Host "ENCONTRADO: ID: $($_.id) | Nome: $($_.full_name) | Code: $($_.referral_code) | Org: $($_.organization_id)"
        }
    } else {
        Write-Host "NÃO ENCONTRADO: Ninguém com referral_code 'mariafran'."
        Write-Host "Exemplos de códigos existentes:"
        $res | Select-Object -First 5 | ForEach-Object { Write-Host " - $($_.referral_code)" }
    }
} catch {
    Write-Host "Erro: $_"
}

Write-Host "`n--- ÚLTIMOS LOGS DE DEBUG ---"
try {
    $logs = Invoke-RestMethod -Uri "$url/rest/v1/debug_logs?select=*&order=created_at.desc&limit=5" -Method Get -Headers $headers
    $logs | ForEach-Object {
        Write-Host "[$($_.created_at)] $($_.operation): $($_.message)"
    }
} catch {
    Write-Host "Erro: $_"
}
