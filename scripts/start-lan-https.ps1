$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
& (Join-Path $PSScriptRoot "ensure-dev-cert.ps1")

$env:VITE_DEV_HTTPS = "1"
& (Join-Path $repoRoot "node_modules\.bin\vite.cmd") --host 0.0.0.0 --port 15173 --strictPort
