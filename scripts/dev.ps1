# Dev launcher (Windows). Starts FastAPI with --reload and Vite with HMR in
# separate windows so logs stay legible and Ctrl-C only kills one side.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "starting backend (uvicorn --reload) on :8000"
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root\backend'; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
)

Write-Host "starting frontend (vite) on :5173"
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root\frontend'; npm run dev"
)

Write-Host "two windows opened. backend: http://localhost:8000  frontend: http://localhost:5173"
