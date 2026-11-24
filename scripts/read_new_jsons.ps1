Add-Type -AssemblyName System.IO.Compression.FileSystem

function Read-Json($zipPath, $jsonName) {
    Write-Host "========== $zipPath -> $jsonName =========="
    $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    $entry = $zip.Entries | Where-Object { $_.Name -eq $jsonName }
    if ($entry) {
        $reader = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
        $content = $reader.ReadToEnd()
        $reader.Close()
        Write-Host $content
    }
    $zip.Dispose()
}

Read-Json 'C:\Users\mardonbek\Downloads\13_ta_harbiy_texnika_GLB.zip' 'MODELLAR.json'
Read-Json 'C:\Users\mardonbek\Downloads\4_real_avtomobil_GLB.zip' 'MODELLAR.json'
