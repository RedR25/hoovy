"""Cross-cutting FastAPI dependencies.

Module-specific dependencies live in `app/modules/<name>/dependencies.py`.
This file is reserved for things every module may need: db session, settings,
the current authenticated principal, etc.
"""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_db_session
from app.core.security import decode_token

SettingsDep = Annotated[Settings, Depends(get_settings)]
DbSession = Annotated[AsyncSession, Depends(get_db_session)]

_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_subject(
    token: Annotated[str | None, Depends(_oauth2_scheme)],
) -> str:
    """Return the JWT subject (user id) or raise 401.

    Modules can layer richer dependencies on top of this (e.g. `get_current_user`
    inside the `users` module that resolves the subject to a domain object).
    """
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "not authenticated")
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(exc)) from exc
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "malformed token")
    return sub


CurrentSubject = Annotated[str, Depends(get_current_subject)]
