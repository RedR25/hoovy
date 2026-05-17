from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class KidCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=100)
    avatar_emoji: str = Field(default="🧒", max_length=8)
    dob: date | None = None


class KidRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    parent_user_id: UUID
    display_name: str
    avatar_emoji: str
    dob: date | None
    created_at: datetime
