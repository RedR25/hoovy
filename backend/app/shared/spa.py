"""SPA static-file mount.

Kept here (not in main.py) so the concern is isolated: main wires modules,
this module owns the rule "serve `dist/` with deep-link fallback to
index.html". Call AFTER all API routers are registered — the catchall
matches everything, so anything that should win must register first.

No-op when the build directory is missing; that's the dev case where the
SPA is served by Vite on a separate port with HMR.
"""
from pathlib import Path

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import FileResponse


def mount_spa(app: FastAPI, dist_dir: Path | None, api_prefix: str) -> None:
    if dist_dir is None:
        return
    dist_dir = dist_dir.resolve()
    index_file = dist_dir / "index.html"
    if not index_file.is_file():
        return

    api_prefix_clean = api_prefix.strip("/")
    reserved = {api_prefix_clean, "health", "docs", "redoc", "openapi.json"}

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str) -> FileResponse:
        head = full_path.split("/", 1)[0]
        if head in reserved:
            raise HTTPException(status.HTTP_404_NOT_FOUND)

        candidate = (dist_dir / full_path).resolve()
        # Guard against path traversal.
        if dist_dir not in candidate.parents and candidate != dist_dir:
            raise HTTPException(status.HTTP_404_NOT_FOUND)

        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(index_file)
