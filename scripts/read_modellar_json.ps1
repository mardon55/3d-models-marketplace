Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('C:\Users\mardonbek\Downloads\100_GLB_haqiqiy_qurollar_bilan.zip')
$entry = $zip.Entries | Where-Object { $_.Name -eq "MODELLAR.json" }
$reader = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
$content = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()

$json = $content | ConvertFrom-Json
$json | Select-Object -First 5 | Format-List
