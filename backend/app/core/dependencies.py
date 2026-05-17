"""Cross-cutting FastAPI dependencies.

Module-specific dependencies live in `app/modules/<name>/dependencies.py`.
This file is reserved for things every module may need: db session, settings, etc.
"""
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_db_session

SettingsDep = Annotated[Settings, Depends(get_settings)]
DbSession = Annotated[AsyncSession, Depends(get_db_session)]
