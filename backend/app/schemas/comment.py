from pydantic import BaseModel
from typing import Optional

class CreateCommentRequest(BaseModel):
    content: str
    rating: Optional[float] = None

class ReplyCommentRequest(BaseModel):
    content: str

class CommentStatusUpdate(BaseModel):
    status: str  # "Visible" | "Hidden"
