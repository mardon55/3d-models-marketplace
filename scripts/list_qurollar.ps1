Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\Users\mardonbek\Downloads\100_GLB_haqiqiy_qurollar_bilan.zip')
$qurollar = $zip.Entries | Where-Object { $_.FullName -like "*01_Qurollar*" -and $_.Length -gt 0 }
foreach ($q in $qurollar) {
    Write-Host "$($q.Name) | $([math]::Round($q.Length/1MB, 2)) MB"
}
$zip.Dispose()
