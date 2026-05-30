$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$certDir = Join-Path $repoRoot ".cert"
$certPath = Join-Path $certDir "dev-cert.pem"
$pfxPath = Join-Path $certDir "dev-cert.pfx"
$pfxPassword = "camera-transfer-dev"

if ((Test-Path $certPath) -and (Test-Path $pfxPath)) {
  Write-Host "Using existing dev HTTPS certificate."
  exit 0
}

New-Item -ItemType Directory -Force -Path $certDir | Out-Null

$rsa = [System.Security.Cryptography.RSA]::Create(2048)
$subject = [System.Security.Cryptography.X509Certificates.X500DistinguishedName]::new("CN=localhost")
$request = [System.Security.Cryptography.X509Certificates.CertificateRequest]::new(
  $subject,
  $rsa,
  [System.Security.Cryptography.HashAlgorithmName]::SHA256,
  [System.Security.Cryptography.RSASignaturePadding]::Pkcs1
)

$request.CertificateExtensions.Add(
  [System.Security.Cryptography.X509Certificates.X509BasicConstraintsExtension]::new($false, $false, 0, $false)
)
$request.CertificateExtensions.Add(
  [System.Security.Cryptography.X509Certificates.X509KeyUsageExtension]::new(
    [System.Security.Cryptography.X509Certificates.X509KeyUsageFlags]::DigitalSignature -bor
      [System.Security.Cryptography.X509Certificates.X509KeyUsageFlags]::KeyEncipherment,
    $false
  )
)

$serverAuth = [System.Security.Cryptography.OidCollection]::new()
$serverAuth.Add([System.Security.Cryptography.Oid]::new("1.3.6.1.5.5.7.3.1")) | Out-Null
$request.CertificateExtensions.Add(
  [System.Security.Cryptography.X509Certificates.X509EnhancedKeyUsageExtension]::new($serverAuth, $false)
)

$san = [System.Security.Cryptography.X509Certificates.SubjectAlternativeNameBuilder]::new()
$san.AddDnsName("localhost")
$san.AddDnsName("127.0.0.1")
$san.AddIpAddress([System.Net.IPAddress]::Parse("127.0.0.1"))

try {
  Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
      $_.IPAddress -notlike "169.254.*" -and
      $_.IPAddress -ne "127.0.0.1"
    } |
    ForEach-Object {
      $san.AddIpAddress([System.Net.IPAddress]::Parse($_.IPAddress))
    }
} catch {
  Write-Host "Could not enumerate LAN IPs. Certificate will still include localhost."
}

$request.CertificateExtensions.Add($san.Build())

$certificate = $request.CreateSelfSigned(
  [System.DateTimeOffset]::Now.AddDays(-1),
  [System.DateTimeOffset]::Now.AddYears(1)
)

$certPem = "-----BEGIN CERTIFICATE-----`n" +
  [System.Convert]::ToBase64String(
    $certificate.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert),
    [System.Base64FormattingOptions]::InsertLineBreaks
  ) +
  "`n-----END CERTIFICATE-----`n"

Set-Content -Path $certPath -Value $certPem -Encoding ascii
[System.IO.File]::WriteAllBytes(
  $pfxPath,
  $certificate.Export(
    [System.Security.Cryptography.X509Certificates.X509ContentType]::Pfx,
    $pfxPassword
  )
)

Write-Host "Created dev HTTPS certificate at $certPath."
