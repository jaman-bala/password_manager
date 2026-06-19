from datetime import datetime
from ninja import Schema


class AttachmentDTO(Schema):
    id: int
    filename: str
    content_type: str
    size: int
    uploaded_at: datetime

    class Config:
        from_attributes = True