Add-Type -AssemblyName System.IO.Compression.FileSystem

$z = 'C:\Users\mardonbek\Downloads\Realistik-avtomobillar-100-qism-02.zip'
if (Test-Path $z) {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($z)
    foreach ($e in $zip.Entries) {
        if (-not $e.FullName.EndsWith('.glb')) {
            Write-Host "Part 2 Non-GLB: $($e.FullName)"
        }
    }
    $zip.Dispose()
} else {
    Write-Host "Part 2 not found"
}
