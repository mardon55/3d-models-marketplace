Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = 'C:\Users\mardonbek\Downloads\100_GLB_haqiqiy_qurollar_bilan.zip'
$outPublicModels = 'public\models'
$outPublicPreviews = 'public\assets\previews'

New-Item -ItemType Directory -Force -Path $outPublicModels | Out-Null
New-Item -ItemType Directory -Force -Path "$outPublicModels\qurollar" | Out-Null
New-Item -ItemType Directory -Force -Path "$outPublicModels\mashinalar" | Out-Null
New-Item -ItemType Directory -Force -Path "$outPublicModels\binolar" | Out-Null
New-Item -ItemType Directory -Force -Path $outPublicPreviews | Out-Null
New-Item -ItemType Directory -Force -Path 'scripts' | Out-Null

$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)

$count = 0
foreach ($entry in $zip.Entries) {
    if ($entry.Length -eq 0) { continue }
    
    $name = $entry.Name
    $dest = $null

    if ($entry.FullName -like "*01_Qurollar/*") {
        $dest = "$outPublicModels\qurollar\$name"
    } elseif ($entry.FullName -like "*02_Mashinalar/*") {
        $dest = "$outPublicModels\mashinalar\$name"
    } elseif ($entry.FullName -like "*03_Uylar_va_binolar/*") {
        $dest = "$outPublicModels\binolar\$name"
    } elseif ($entry.FullName -like "*Rasmlar/*") {
        $dest = "$outPublicPreviews\$name"
    } elseif ($name -eq "MODELLAR.json") {
        $dest = "scripts\MODELLAR.json"
    }

    if ($dest) {
        $dir = [System.IO.Path]::GetDirectoryName($dest)
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
        }
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest, $true)
        $count++
        if ($count % 20 -eq 0) {
            Write-Host "Extracted $count files..."
        }
    }
}

$zip.Dispose()
Write-Host "Successfully extracted $count files from archive!"
