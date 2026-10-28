from datetime import datetime
from typing import List, Optional
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
    items: List[NotificationOut]
    total: int
    unread_count: int
    page: int
    limit: int

class UnreadCountOut(BaseModel):
    unread_count: int
