$ports = 3001,5173,5174
netstat -ano | Select-String ($ports | ForEach-Object {":$_"}) |
  ForEach-Object { ($_ -replace '\s+',' ').Split(' ')[-1] } |
  Sort-Object -Unique |
  ForEach-Object { try { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } catch {} }

# Also stop common dev server processes that may remain (vite, nodemon, npm)
@('vite','nodemon','npm') | ForEach-Object {
  try { Get-Process -Name $_ -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue } catch {}
}