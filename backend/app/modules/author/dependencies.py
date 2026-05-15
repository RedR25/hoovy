"""DI wiring for the author module."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from app.modules.author.service import AuthorService
from app.modules.images.dependencies import get_image_gen_service
from app.modules.scenarios.dependencies import get_scenario_service


def get_author_service(
    scenario_service=Depends(get_scenario_service),
    image_gen_service=Depends(get_image_gen_service),
) -> AuthorService:
    return AuthorService(
        scenario_service=scenario_service,
        image_gen_service=image_gen_service,
    )


AuthorServiceDep = Annotated[AuthorService, Depends(get_author_service)]
