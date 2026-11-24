Add-Type -AssemblyName System.IO.Compression.FileSystem

# Ensure directories
$dirs = @(
    'public\models\harbiy',
    'public\models\mashinalar',
    'public\assets\previews\harbiy',
    'public\assets\previews\cars'
)
foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Force -Path $d | Out-Null
    }
}

# 1. military.zip
$milZip = 'C:\Users\mardonbek\Downloads\military.zip'
if (Test-Path $milZip) {
    Write-Host "Extracting $milZip..."
    $z = [System.IO.Compression.ZipFile]::OpenRead($milZip)
    foreach ($e in $z.Entries) {
        if ($e.Length -eq 0) { continue }
        if ($e.Name.EndsWith('.glb')) {
            $dest = "public\models\harbiy\$($e.Name)"
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, $dest, $true)
            Write-Host "Extracted military GLB: $($e.Name)"
        } elseif ($e.Name.EndsWith('.webp') -or $e.Name.EndsWith('.png')) {
            $dest = "public\assets\previews\harbiy\$($e.Name)"
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, $dest, $true)
            Write-Host "Extracted military preview: $($e.Name)"
        }
    }
    $z.Dispose()
}

# 2. motionmistry zips
$mZips = @(
    'C:\Users\mardonbek\Downloads\motionmistry-missile-prsm-xfortunax.zip',
    'C:\Users\mardonbek\Downloads\motionmistry-j35-hrd4588.zip',
    'C:\Users\mardonbek\Downloads\motionmistry-shahed136-faintastic.zip',
    'C:\Users\mardonbek\Downloads\motionmistry-tb2-bayraktar-thedevilseye.zip',
    'C:\Users\mardonbek\Downloads\motionmistry-f35-lowpoly-s1priv.zip'
)
foreach ($mz in $mZips) {
    if (Test-Path $mz) {
        Write-Host "Extracting $mz..."
        $z = [System.IO.Compression.ZipFile]::OpenRead($mz)
        foreach ($e in $z.Entries) {
            if ($e.Length -gt 0 -and $e.Name.EndsWith('.glb')) {
                $dest = "public\models\harbiy\$($e.Name)"
                [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, $dest, $true)
                Write-Host "Extracted motionmistry GLB: $($e.Name)"
            }
        }
        $z.Dispose()
    }
}

# 3. Realistik-avtomobillar-100-qism-01.zip
$car01 = 'C:\Users\mardonbek\Downloads\Realistik-avtomobillar-100-qism-01.zip'
if (Test-Path $car01) {
    Write-Host "Extracting $car01..."
    $z = [System.IO.Compression.ZipFile]::OpenRead($car01)
    foreach ($e in $z.Entries) {
        if ($e.Length -eq 0) { continue }
        if ($e.FullName -like '*modellar/*' -and $e.Name.EndsWith('.glb')) {
            $dest = "public\models\mashinalar\$($e.Name)"
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, $dest, $true)
            Write-Host "Car 01 GLB: $($e.Name)"
        } elseif ($e.FullName -like '*rasmlar/*' -and ($e.Name.EndsWith('.jpg') -or $e.Name.EndsWith('.png'))) {
            $dest = "public\assets\previews\cars\$($e.Name)"
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, $dest, $true)
            Write-Host "Car 01 Image: $($e.Name)"
        } elseif ($e.Name -eq 'CREDITS.csv') {
            $dest = 'scripts\CREDITS_01.csv'
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, $dest, $true)
        }
    }
    $z.Dispose()
}

# 4. Realistik-avtomobillar-100-qism-02.zip
$car02 = 'C:\Users\mardonbek\Downloads\Realistik-avtomobillar-100-qism-02.zip'
if (Test-Path $car02) {
    Write-Host "Extracting $car02..."
    $z = [System.IO.Compression.ZipFile]::OpenRead($car02)
    foreach ($e in $z.Entries) {
        if ($e.Length -eq 0) { continue }
        if ($e.FullName -like '*modellar/*' -and $e.Name.EndsWith('.glb')) {
            $dest = "public\models\mashinalar\$($e.Name)"
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, $dest, $true)
            Write-Host "Car 02 GLB: $($e.Name)"
        } elseif ($e.FullName -like '*rasmlar/*' -and ($e.Name.EndsWith('.jpg') -or $e.Name.EndsWith('.png'))) {
            $dest = "public\assets\previews\cars\$($e.Name)"
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, $dest, $true)
            Write-Host "Car 02 Image: $($e.Name)"
        } elseif ($e.Name -eq 'CREDITS.csv') {
            $dest = 'scripts\CREDITS_02.csv'
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e, $dest, $true)
        }
    }
    $z.Dispose()
}

Write-Host "=== Extraction Complete ==="
