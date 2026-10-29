import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname,'..');
const git = (...args) => { const r = spawnSync('git',args,{cwd:root,encoding:'utf8'}); if(r.status !== 0) throw new Error(`git ${args[0]} failed`); return r.stdout.trim(); };
try {
  const version = JSON.parse(readFileSync(resolve(root,'package.json'),'utf8')).version;
  const tag = process.argv[2]; if(tag !== `v${version}`) throw new Error('Pass the matching v<package version> tag');
  if(git('status','--porcelain')) throw new Error('Release requires a clean checkout');
  if(git('rev-parse',`${tag}^{commit}`) !== git('rev-parse','HEAD')) throw new Error('Tag must point at HEAD');
  const name = `svg-cli-${version}-win-x64.zip`;
  const zip = readFileSync(resolve(root,'release',name)); const checksums = readFileSync(resolve(root,'release/SHA256SUMS.txt'));
  const hash = createHash('sha256').update(zip).digest('hex');
  if(checksums.toString('utf8').trim() !== `${hash}  ${name}`) throw new Error('Package checksum does not match');
  const credentials = spawnSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\n\n',cwd:root,encoding:'utf8',env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'}});
  if(credentials.status !== 0) throw new Error('Git Credential Manager authentication unavailable');
  const token = credentials.stdout.split(/\r?\n/).find(l=>l.startsWith('password='))?.slice(9);
  if(!token) throw new Error('No GitHub credential available');
  const base = 'https://api.github.com/repos/Monthlyaway/svg-cli';
  const request = async (url, options = {}) => {
    const response = await fetch(url,{...options,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:`Bearer ${token}`,'User-Agent':'svg-cli-release',...options.headers}});
    if(!response.ok) throw new Error(`GitHub API ${response.status}: ${(await response.text()).slice(0,400)}`);
    return response.json();
  };
  const releases = await request(`${base}/releases?per_page=100`);
  let release = releases.find(r=>r.tag_name === tag);
  if(release && !release.draft) throw new Error('This release is already published; increment version for improvements');
  const changelog = readFileSync(resolve(root,'CHANGELOG.md'),'utf8');
  const section = changelog.split(/^## /m).find(s=>s.startsWith(`${version} `));
  if(!section) throw new Error('CHANGELOG is missing this release');
  const body = `${section.trim()}\n\nWindows 10/11 x64: 下载并解压 ${name}，运行 svg-cli.cmd。包含 Node.js，无需安装开发工具。\n\n源码提交：${git('rev-parse','HEAD')}\n\nSHA256: ${hash}\n\n教程：[doc/TUTORIAL.md](https://github.com/Monthlyaway/svg-cli/blob/${tag}/doc/TUTORIAL.md)`;
  if(!release) release = await request(`${base}/releases`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tag_name:tag,name:`SVG CLI ${tag}`,body,draft:true,prerelease:version.startsWith('0.')})});
  for(const [filename,content,mime] of [[name,zip,'application/zip'],['SHA256SUMS.txt',checksums,'text/plain']]) {
    const existing = release.assets.find(a=>a.name===filename);
    if(existing) { if(existing.size!==content.length) throw new Error(`Existing draft asset mismatch: ${filename}`); continue; }
    await request(`${release.upload_url.split('{')[0]}?name=${encodeURIComponent(filename)}`,{method:'POST',headers:{'Content-Type':mime},body:content});
  }
  const ready = await request(`${base}/releases/${release.id}`);
  if(![name,'SHA256SUMS.txt'].every(n=>ready.assets.some(a=>a.name===n))) throw new Error('Draft is missing required assets');
  const published = await request(`${base}/releases/${release.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft:false,body,make_latest:version.startsWith('0.')?'false':'true'})});
  console.log(`Published ${published.html_url}`);
} catch(error) { console.error(`Release failed: ${error.message}`); process.exitCode=1; }
