"""FastAPI Backend Entrypoint (mirrors api/index.py for local uvicorn execution)."""
from api.index import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.index:app", host="0.0.0.0", port=8000, reload=True)

