# --- backend ---
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -e ".[dev]"
cd ..

# --- frontend ---
cd frontend
npm install
cd ..

# --- models (one-time) ---
ollama pull gemma4:e2b
# optional, stronger model for the /author tool:
# ollama pull gemma4:e4b

# --- run both ---
.\scripts\dev.ps1
# backend: http://localhost:8000   frontend: http://localhost:5173