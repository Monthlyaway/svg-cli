param()
$ErrorActionPreference = 'Stop'
function Get-Sha256([string]$LiteralPath) {
    $stream = [IO.File]::OpenRead($LiteralPath)
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return ([BitConverter]::ToString($sha.ComputeHash($stream))).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose(); $stream.Dispose() }
}
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Push-Location $projectRoot
try {
    & npm.cmd run check
    if ($LASTEXITCODE -ne 0) { throw 'Quality checks failed' }
    $dirty = & git status --porcelain
    if ($dirty) { throw 'Commit source and documentation before packaging a release' }
    $package = Get-Content -LiteralPath 'package.json' -Raw | ConvertFrom-Json
    $nodeVersion = '24.13.0'
    $nodeSha256 = 'ca2742695be8de44027d71b3f53a4bdb36009b95575fe1ae6f7f0b5ce091cb88'
    $cache = Join-Path $projectRoot '.cache'
    New-Item -ItemType Directory -Force -Path $cache | Out-Null
    $archive = Join-Path $cache "node-v$nodeVersion-win-x64.zip"
    if (!(Test-Path -LiteralPath $archive)) {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -UseBasicParsing -Uri "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-win-x64.zip" -OutFile $archive
    }
    if ((Get-Sha256 $archive) -ne $nodeSha256) { throw 'Node runtime SHA256 mismatch' }
    $releaseRoot = Join-Path $projectRoot 'release'
    $name = "svg-cli-$($package.version)-win-x64"
    $stage = Join-Path $releaseRoot ($name + '-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Force -Path (Join-Path $stage 'dist'), (Join-Path $stage 'runtime'), (Join-Path $stage 'node_modules/@xmldom') | Out-Null
    Copy-Item -LiteralPath 'dist/src' -Destination (Join-Path $stage 'dist/src') -Recurse
    Copy-Item -LiteralPath 'node_modules/@xmldom/xmldom' -Destination (Join-Path $stage 'node_modules/@xmldom/xmldom') -Recurse
    foreach ($entry in @('README.md','LICENSE','package.json','doc','examples','svg-cli.cmd','THIRD-PARTY-NOTICES.md')) { Copy-Item -LiteralPath $entry -Destination $stage -Recurse }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $nodeZip = [IO.Compression.ZipFile]::OpenRead($archive)
    try {
        [IO.Compression.ZipFileExtensions]::ExtractToFile($nodeZip.GetEntry("node-v$nodeVersion-win-x64/node.exe"), (Join-Path $stage 'runtime/node.exe'))
        [IO.Compression.ZipFileExtensions]::ExtractToFile($nodeZip.GetEntry("node-v$nodeVersion-win-x64/LICENSE"), (Join-Path $stage 'runtime/LICENSE-Node.txt'))
    } finally { $nodeZip.Dispose() }
    $commit = (& git rev-parse HEAD).Trim()
    @{ version=$package.version; commit=$commit; platform='win-x64'; node=$nodeVersion; nodeArchiveSha256=$nodeSha256 } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $stage 'release-manifest.json') -Encoding UTF8
    & (Join-Path $stage 'runtime/node.exe') (Join-Path $stage 'dist/src/cli/Main.js') --version
    if ($LASTEXITCODE -ne 0) { throw 'Packaged runtime smoke check failed' }
    $target = Join-Path $releaseRoot "$name.zip"
    if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target }
    [IO.Compression.ZipFile]::CreateFromDirectory($stage, $target)
    $checksum = Get-Sha256 $target
    [IO.File]::WriteAllText((Join-Path $releaseRoot 'SHA256SUMS.txt'), "$checksum  $name.zip`n", (New-Object Text.UTF8Encoding($false)))
    $resolvedStage = [IO.Path]::GetFullPath($stage)
    if (!$resolvedStage.StartsWith(([IO.Path]::GetFullPath($releaseRoot) + [IO.Path]::DirectorySeparatorChar), [StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid staging path' }
    Remove-Item -LiteralPath $resolvedStage -Recurse -Force
    Write-Output "Built $target"
} finally { Pop-Location }
