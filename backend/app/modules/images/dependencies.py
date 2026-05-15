"""DI wiring for the images module."""
from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import Depends

from app.modules.images.service import ImageGenService


@lru_cache(maxsize=1)
def _get_image_gen_service() -> ImageGenService:
    return ImageGenService()


def get_image_gen_service() -> ImageGenService:
    return _get_image_gen_service()


ImageGenServiceDep = Annotated[ImageGenService, Depends(get_image_gen_service)]
