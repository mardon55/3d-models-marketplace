Add-Type -AssemblyName System.IO.Compression.FileSystem

$z = [System.IO.Compression.ZipFile]::OpenRead('C:\Users\mardonbek\Downloads\Realistik-avtomobillar-100-qism-01.zip')
$e = $z.Entries | Where-Object { $_.Name -eq 'CREDITS.csv' }
if ($e) {
    $stream = $e.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $text = $reader.ReadToEnd()
    $reader.Close()
    $stream.Close()
    Write-Host $text
}
$z.Dispose()
