Add-Type -AssemblyName System.IO.Compression.FileSystem

$harbiyZip = 'C:\Users\mardonbek\Downloads\13_ta_harbiy_texnika_GLB.zip'
$carZip = 'C:\Users\mardonbek\Downloads\4_real_avtomobil_GLB.zip'

New-Item -ItemType Directory -Force -Path 'public\models\harbiy' | Out-Null
New-Item -ItemType Directory -Force -Path 'public\models\mashinalar' | Out-Null
New-Item -ItemType Directory -Force -Path 'public\assets\previews\harbiy' | Out-Null
New-Item -ItemType Directory -Force -Path 'public\assets\previews\cars' | Out-Null

# 1. Extract Harbiy
$zip1 = [System.IO.Compression.ZipFile]::OpenRead($harbiyZip)
foreach ($e in $zip1.Entries) {
    if ($e.Length -eq 0) { continue }
    $name = $e.Name
    $dest = $null

    if ($e.FullName -like "*01_Tanklar/*" -or $e.FullName -like "*02_Zirhli_mashinalar/*" -or $e.FullName -like "*03_Yuk_mashinalari/*" -or $e.FullName -like "*04_Artilleriya/*" -or $e.FullName -like "*05_Samolyotlar/*" -or $e.FullName -like "*06_Vertolyotlar/*") {
        if ($name.EndsWith(".glb")) {
            $dest = "public\models\harbiy\$name"
        }
    } elseif ($e.FullName -like "*Rasmlar/*" -and $name.EndsWith(".png")) {
        $dest = "public\assets\previews\harbiy\$name"
    } elseif ($name -eq "MODELLAR.json") {
        $dest = "scripts\MODELLAR_harbiy.json"
    }

    if ($dest) {
        $dir = [System.IO.Path]::GetDirectoryName($dest)
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, $dest, $true)
        Write-Host "Harbiy extracted: $name -> $dest"
    }
}
$zip1.Dispose()

# 2. Extract Cars
$zip2 = [System.IO.Compression.ZipFile]::OpenRead($carZip)
foreach ($e in $zip2.Entries) {
    if ($e.Length -eq 0) { continue }
    $name = $e.Name
    $dest = $null

    if ($e.FullName -like "*Modellar/*" -and $name.EndsWith(".glb")) {
        $dest = "public\models\mashinalar\$name"
    } elseif ($e.FullName -like "*Rasmlar/*" -and $name.EndsWith(".png")) {
        $dest = "public\assets\previews\cars\$name"
    } elseif ($name -eq "MODELLAR.json") {
        $dest = "scripts\MODELLAR_cars.json"
    }

    if ($dest) {
        $dir = [System.IO.Path]::GetDirectoryName($dest)
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, $dest, $true)
        Write-Host "Car extracted: $name -> $dest"
    }
}
$zip2.Dispose()

Write-Host "Extraction completed successfully!"
