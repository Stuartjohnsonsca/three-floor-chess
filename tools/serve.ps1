# Minimal static file server (no Node/Python required).
# Usage: powershell -File tools\serve.ps1 [-Port 8420] [-Root <dir>]
param(
    [int]$Port = 8420,
    [string]$Root = (Split-Path $PSScriptRoot -Parent)
)

$Root = (Resolve-Path $Root).Path
$mime = @{
    '.html'='text/html; charset=utf-8'; '.htm'='text/html; charset=utf-8'
    '.js'='text/javascript; charset=utf-8'; '.mjs'='text/javascript; charset=utf-8'
    '.css'='text/css; charset=utf-8'; '.json'='application/json; charset=utf-8'
    '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.gif'='image/gif'
    '.svg'='image/svg+xml'; '.ico'='image/x-icon'; '.webmanifest'='application/manifest+json'
    '.woff'='font/woff'; '.woff2'='font/woff2'; '.md'='text/plain; charset=utf-8'
    '.wasm'='application/wasm'
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "Serving $Root at http://localhost:$Port/ (Ctrl+C to stop)"

while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
        # a client that never sends a full request must not wedge the (serial) loop
        $client.ReceiveTimeout = 3000
        $client.SendTimeout = 5000
        $stream = $client.GetStream()
        $reader = [System.IO.StreamReader]::new($stream)
        $requestLine = $reader.ReadLine()
        while (($line = $reader.ReadLine()) -and $line -ne '') { }  # drain headers
        if (-not $requestLine) { $client.Close(); continue }

        $rawPath = ($requestLine -split ' ')[1]
        $path = [Uri]::UnescapeDataString(($rawPath -split '\?')[0])
        if ($path -eq '/') { $path = '/index.html' }
        $file = Join-Path $Root ($path -replace '/', '\').TrimStart('\')

        $full = [System.IO.Path]::GetFullPath($file)
        if ($full.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path $full -PathType Leaf)) {
            $bytes = [System.IO.File]::ReadAllBytes($full)
            $ext = [System.IO.Path]::GetExtension($full).ToLower()
            $type = $mime[$ext]; if (-not $type) { $type = 'application/octet-stream' }
            $header = "HTTP/1.1 200 OK`r`nContent-Type: $type`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
        } else {
            $bytes = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
            $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
        }
        $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
        $stream.Write($headerBytes, 0, $headerBytes.Length)
        $stream.Write($bytes, 0, $bytes.Length)
        $stream.Flush()
    } catch { }
    finally { $client.Close() }
}
