$url = "https://clnuievcdnbwqbyqhwys.supabase.co"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTQ5MzAsImV4cCI6MjA4NzY5MDkzMH0.ACpA-x-7OMjom6lEe0FeVc8oXWkNrOukup7YuUnFqAE"

$headers = @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
}

Write-Host "--- ORGANIZAÇÕES ---"
try {
    $orgs = Invoke-RestMethod -Uri "$url/rest/v1/organizations?select=id,name" -Method Get -Headers $headers
    $orgs | ForEach-Object {
        Write-Host "ID: $($_.id) | Nome: $($_.name)"
    }
} catch {
    Write-Host "Erro: $_"
}
