param([string]$Version)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (!$Version) { $Version = (Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version }
if ($Version -notmatch '^\d+\.\d+\.\d+$') { throw 'Invalid version' }
$archive = Join-Path $projectRoot "release/svg-cli-$Version-win-x64.zip"
$smokeRoot = Join-Path $projectRoot ('.cache/portable-' + $Version + '-' + [guid]::NewGuid().ToString('N'))
$packageRoot = Join-Path $smokeRoot '便携包 Chinese path'
$working = Join-Path $smokeRoot '用户作品 output'
New-Item -ItemType Directory -Force -Path $packageRoot,$working | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem
[IO.Compression.ZipFile]::ExtractToDirectory($archive,$packageRoot)
$manifest = Get-Content -LiteralPath (Join-Path $packageRoot 'release-manifest.json') -Raw | ConvertFrom-Json
if ($manifest.version -ne $Version) { throw 'Manifest version mismatch' }
$originalPath = $env:PATH
Push-Location $working
try {
    $env:PATH = "$env:SystemRoot\System32;$env:SystemRoot"
    $launcher = Join-Path $packageRoot 'svg-cli.cmd'
    $reported = & $launcher --version
    if ($LASTEXITCODE -ne 0 -or $reported -ne "svg-cli $Version") { throw 'Version smoke failed' }
    $cases = @{
        '01-first-drawing.svgcli' = 'first-drawing.svg'
        '02-flowchart.svgcli' = 'flowchart.svg'
        '03-status-board.svgcli' = 'status-board.svg'
        '04-floor-plan.svgcli' = 'floor-plan.svg'
    }
    foreach ($script in ($cases.Keys | Sort-Object)) {
        $transcript = & $launcher --script (Join-Path $packageRoot "examples/$script")
        if ($LASTEXITCODE -ne 0) { throw "Portable case failed: $script" }
        $output = Join-Path $working $cases[$script]
        $golden = Join-Path $packageRoot ('examples/expected/' + $cases[$script])
        if ([IO.File]::ReadAllText($output) -ne [IO.File]::ReadAllText($golden)) { throw "Portable output mismatch: $script" }
        [IO.File]::WriteAllLines((Join-Path $working ($script + '.log')), [string[]]$transcript, (New-Object Text.UTF8Encoding($false)))
        Write-Output "PASS portable $script (bundled runtime, isolated PATH, separate Unicode working directory)"
    }
    $bad = Join-Path $working 'bad.svgcli'
    [IO.File]::WriteAllText($bad,"init`nscale missing 0`n", (New-Object Text.UTF8Encoding($false)))
    # cmd captures stderr so PowerShell 5 does not treat expected native error output as a terminating error.
    $process = New-Object Diagnostics.Process
    $process.StartInfo.FileName = Join-Path $packageRoot 'runtime/node.exe'
    $process.StartInfo.Arguments = '"' + (Join-Path $packageRoot 'dist/src/cli/Main.js') + '" --script "' + $bad + '"'
    $process.StartInfo.UseShellExecute = $false
    $process.StartInfo.CreateNoWindow = $true
    $process.StartInfo.RedirectStandardError = $true
    $process.StartInfo.RedirectStandardOutput = $true
    [void]$process.Start()
    $errorText = $process.StandardError.ReadToEnd(); [void]$process.StandardOutput.ReadToEnd(); $process.WaitForExit()
    if ($process.ExitCode -ne 1 -or $errorText -notmatch '^error:') { throw 'Packaged failure exit smoke failed' }
    $process.Dispose()
    $report = Join-Path $projectRoot "artifacts/smoke-$Version.json"
    New-Item -ItemType Directory -Force -Path (Split-Path $report) | Out-Null
    @{ version=$Version; commit=$manifest.commit; cases=4; isolatedPath=$true; unicodeWorkingDirectory=$true; failureExitCode=1 } | ConvertTo-Json | Set-Content -LiteralPath $report -Encoding UTF8
} finally { Pop-Location; $env:PATH = $originalPath }
