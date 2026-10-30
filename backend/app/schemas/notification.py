from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime
    updated_at: datetime

class NotificationListOut(BaseModel):
    items: list[NotificationOut]
    total: int
    unread_count: int
    page: int
    limit: int

class UnreadCountOut(BaseModel):
    unread_count: int
