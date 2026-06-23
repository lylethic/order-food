from pydantic import BaseModel
from typing import Optional

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None

class AssignRoleRequest(BaseModel):
    roleId: int

class RoleOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    active: bool
    deleted: bool

    model_config = {"from_attributes": True}
