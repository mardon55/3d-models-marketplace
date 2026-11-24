Add-Type -AssemblyName System.IO.Compression.FileSystem

$mZips = @(
    'C:\Users\mardonbek\Downloads\military.zip',
    'C:\Users\mardonbek\Downloads\motionmistry-missile-prsm-xfortunax.zip',
    'C:\Users\mardonbek\Downloads\motionmistry-j35-hrd4588.zip',
    'C:\Users\mardonbek\Downloads\motionmistry-shahed136-faintastic.zip',
    'C:\Users\mardonbek\Downloads\motionmistry-tb2-bayraktar-thedevilseye.zip',
    'C:\Users\mardonbek\Downloads\motionmistry-f35-lowpoly-s1priv.zip'
)

foreach ($mz in $mZips) {
    if (Test-Path $mz) {
        Write-Host "=== $mz ==="
        $zip = [System.IO.Compression.ZipFile]::OpenRead($mz)
        foreach ($e in $zip.Entries) {
            Write-Host "  $($e.FullName) ($($e.Length) bytes)"
        }
        $zip.Dispose()
    }
}
