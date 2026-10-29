# Third-party software

Windows portable packages include the official Node.js v24.13.0 win-x64 runtime.
Its full license and third-party attributions are in `runtime/LICENSE-Node.txt`.
The archive SHA256 is pinned in `scripts/Build-Release.ps1` and was checked against
<https://nodejs.org/dist/v24.13.0/SHASUMS256.txt>.

SVG XML parsing uses `@xmldom/xmldom` 0.9.12 (MIT).
Its license is included at `node_modules/@xmldom/xmldom/LICENSE` in portable packages.
Development-only TypeScript and type declarations are excluded from portable packages.
