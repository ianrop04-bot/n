const express = require('express');
const os = require('os');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

app.use(express.json());

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>『NEXFGEN』◆『HUB』 Cloud Console</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Segoe UI','Courier New',monospace;background:#0d1117;color:#c9d1d9;display:flex;min-height:100vh;}
.sidebar{width:240px;background:#161b22;height:100vh;position:fixed;padding:25px 15px;border-right:1px solid #21262d;}
.logo{color:#58a6ff;font-size:15px;font-weight:bold;margin-bottom:35px;text-align:center;letter-spacing:.5px;}
.nav-item{padding:12px 15px;margin:4px 0;cursor:pointer;border-radius:8px;font-size:14px;transition:.2s;user-select:none;}
.nav-item:hover{background:#21262d;}
.nav-item.active{background:#1f6feb;color:#fff;}
.main{margin-left:240px;padding:30px;width:100%;}
h2{font-size:22px;margin-bottom:20px;color:#e6edf3;}
.card{background:#161b22;border:1px solid #30363d;border-radius:10px;padding:22px;margin-bottom:18px;}
.card h3{margin-bottom:12px;color:#58a6ff;font-size:16px;}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;}
.stat-value{font-size:30px;color:#58a6ff;font-weight:700;}
.stat-label{font-size:13px;color:#8b949e;margin-top:5px;}
.terminal-box{background:#000;color:#00ff41;padding:20px;border-radius:8px;font-family:'Courier New',monospace;font-size:14px;min-height:300px;max-height:400px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;}
.terminal-input{width:100%;background:#0a0a0a;border:1px solid #333;color:#00ff41;padding:10px 15px;font-family:'Courier New',monospace;font-size:14px;margin-top:12px;border-radius:5px;}
.terminal-input:focus{outline:none;border-color:#00ff41;}
.file-list{font-family:'Courier New',monospace;font-size:13px;line-height:1.8;white-space:pre-wrap;}
.btn{background:#21262d;color:#c9d1d9;border:1px solid #30363d;padding:8px 18px;border-radius:6px;cursor:pointer;transition:.2s;font-size:14px;}
.btn:hover{background:#30363d;}
.btn-primary{background:#1f6feb;border-color:#1f6feb;color:#fff;}
.btn-primary:hover{background:#388bfd;}
.path-input{width:100%;background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:10px 15px;font-family:'Courier New',monospace;font-size:14px;border-radius:5px;margin-top:8px;}
.path-input:focus{outline:none;border-color:#58a6ff;}
</style>
</head>
<body>
<div class="sidebar">
<div class="logo">『NEXFGEN』◆『HUB』</div>
<div class="nav-item active" data-page="dashboard">📊 Dashboard</div>
<div class="nav-item" data-page="files">📁 File Manager</div>
<div class="nav-item" data-page="terminal">💻 Terminal</div>
<div class="nav-item" data-page="settings">⚙️ Settings</div>
</div>
<div class="main" id="main-content"></div>
<script>
document.addEventListener('DOMContentLoaded',()=>{
loadPage('dashboard');
document.querySelectorAll('.nav-item').forEach(item=>{
item.addEventListener('click',()=>{
document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
item.classList.add('active');
loadPage(item.dataset.page);
});
});
});
async function loadPage(page){
const main=document.getElementById('main-content');
if(page==='dashboard'){
try{
const res=await fetch('/api/stats');
const s=await res.json();
main.innerHTML='<h2>📊 Server Overview</h2><div class="stat-grid"><div class="card"><div class="stat-value">'+s.cpu+'</div><div class="stat-label">CPU Load Average</div></div><div class="card"><div class="stat-value">'+s.usedMem+' GB</div><div class="stat-label">RAM Used of '+s.totalMem+' GB</div></div><div class="card"><div class="stat-value">'+s.uptime+'h</div><div class="stat-label">Uptime</div></div><div class="card"><div class="stat-value">'+s.platform+'</div><div class="stat-label">Platform</div></div><div class="card"><div class="stat-value">'+s.hostname+'</div><div class="stat-label">Hostname</div></div></div>';
}catch(e){
main.innerHTML='<h2>📊 Server Overview</h2><div class="card">Unable to load stats.</div>';
}
}
if(page==='files'){
main.innerHTML='<h2>📁 File Manager</h2><div class="card"><input class="path-input" id="file-path" placeholder="Enter path (e.g. /var/www)" value="/"><button class="btn btn-primary" id="load-files" style="margin-top:8px;">Browse</button><div class="file-list" id="file-list" style="margin-top:15px;color:#8b949e;">Enter a path and click Browse...</div></div>';
document.getElementById('load-files').addEventListener('click',async()=>{
const p=document.getElementById('file-path').value;
const list=document.getElementById('file-list');
list.innerHTML='Loading...';
try{
const r=await fetch('/api/files?path='+encodeURIComponent(p));
const d=await r.json();
list.innerHTML=d.files||d.error;
}catch(e){list.innerHTML='Error loading files.';}
});
}
if(page==='terminal'){
main.innerHTML='<h2>💻 Terminal</h2><div class="card"><div class="terminal-box" id="terminal-output">『NEXFGEN』◆『HUB』 Console — Ready...<br>Type a command and press Enter.</div><input class="terminal-input" id="terminal-input" placeholder="Enter command..." autofocus></div>';
document.getElementById('terminal-input').addEventListener('keypress',async(e)=>{
if(e.key==='Enter'){
const cmd=e.target.value.trim();
const output=document.getElementById('terminal-output');
if(!cmd)return;
output.innerHTML+='<br><br><span style="color:#fff;">> '+cmd+'</span>';
e.target.value='';
try{
const res=await fetch('/api/terminal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({command:cmd})});
const data=await res.json();
output.innerHTML+='<br>'+data.output;
}catch(err){output.innerHTML+='<br>Error: Could not reach server.';}
output.scrollTop=output.scrollHeight;
}
});
}
if(page==='settings'){
main.innerHTML='<h2>⚙️ Settings</h2><div class="card"><h3>NEXFGEN ◆ HUB Console</h3><p style="color:#8b949e;margin-top:10px;">Settings panel coming in the next update. Stay tuned.</p></div>';
}
}
</script>
</body>
</html>`;

app.get('/', (req, res) => {
    res.send(html);
});

app.get('/api/stats', (req, res) => {
    res.json({
        cpu: os.loadavg()[0].toFixed(2),
        totalMem: (os.totalmem() / 1024 / 1024 / 1024).toFixed(1),
        freeMem: (os.freemem() / 1024 / 1024 / 1024).toFixed(1),
        usedMem: ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(1),
        uptime: Math.floor(os.uptime() / 3600),
        platform: os.platform(),
        hostname: os.hostname()
    });
});

app.get('/api/files', (req, res) => {
    const dir = req.query.path || '/';
    exec('ls -la "' + dir + '"', (err, stdout, stderr) => {
        if (err) return res.json({ error: stderr || err.message });
        res.json({ files: stdout.replace(/\n/g, '<br>') });
    });
});

app.post('/api/terminal', (req, res) => {
    const cmd = req.body.command;
    if (!cmd) return res.json({ output: 'No command entered.' });
    exec(cmd, { timeout: 10000 }, (err, stdout, stderr) => {
        res.json({ output: (stdout || stderr || (err && err.message) || 'Done.').replace(/\n/g, '<br>') });
    });
});

app.listen(PORT, () => {
    console.log('『NEXFGEN』◆『HUB』 Console → http://localhost:' + PORT);
});
