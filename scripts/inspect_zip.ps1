Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\Users\mardonbek\Downloads\100_GLB_haqiqiy_qurollar_bilan.zip')
$summary = @{}
foreach ($entry in $zip.Entries) {
    if ($entry.Length -gt 0) {
        $parts = $entry.FullName -split '/'
        $folder = if ($parts.Length -gt 1) { $parts[1] } else { 'root' }
        if (-not $summary.ContainsKey($folder)) {
            $summary[$folder] = @{ Count = 0; TotalSize = 0; Files = @() }
        }
        $summary[$folder].Count++
        $summary[$folder].TotalSize += $entry.Length
        $summary[$folder].Files += "$($parts[-1]) ($([math]::Round($entry.Length/1MB, 2)) MB)"
    }
}
$zip.Dispose()

foreach ($key in ($summary.Keys | Sort-Object)) {
    Write-Host "=== $key ($($summary[$key].Count) files, $([math]::Round($summary[$key].TotalSize/1MB, 2)) MB) ==="
    $summary[$key].Files | Select-Object -First 5 | ForEach-Object { Write-Host "   $_" }
}
