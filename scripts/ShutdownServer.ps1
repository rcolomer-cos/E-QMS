$ports = 3001,5173,5174
netstat -ano | Select-String ($ports | ForEach-Object {":$_"}) |
  ForEach-Object { ($_ -replace '\s+',' ').Split(' ')[-1] } |
  Sort-Object -Unique |
  ForEach-Object { try { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } catch {} }