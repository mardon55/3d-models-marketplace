Add-Type -AssemblyName System.IO.Compression.FileSystem

$zips = @(
    'C:\Users\mardonbek\Downloads\motionmistry-missile-prsm-xfortunax.zip',
    'C:\Users\mardonbek\Downloads\motionmistry-j35-hrd4588.zip',
    'C:\Users\mardonbek\Downloads\motionmistry-shahed136-faintastic.zip',
    'C:\Users\mardonbek\Downloads\motionmistry-tb2-bayraktar-thedevilseye.zip',
    'C:\Users\mardonbek\Downloads\motionmistry-f35-lowpoly-s1priv.zip',
    'C:\Users\mardonbek\Downloads\military.zip',
    'C:\Users\mardonbek\Downloads\Realistik-avtomobillar-100-qism-01.zip',
    'C:\Users\mardonbek\Downloads\Realistik-avtomobillar-100-qism-02.zip'
)

foreach ($z in $zips) {
    if (Test-Path $z) {
        Write-Host "==================== $z ===================="
        $zip = [System.IO.Compression.ZipFile]::OpenRead($z)
        $glbs = $zip.Entries | Where-Object { $_.FullName -like '*.glb' -or $_.FullName -like '*.gltf' }
        Write-Host "Count: $($glbs.Count)"
        foreach ($e in $glbs) {
            Write-Host " - $($e.FullName) | $([math]::Round($e.Length/1MB, 2)) MB"
        }
        $zip.Dispose()
    } else {
        Write-Host "NOT FOUND: $z"
    }
}
