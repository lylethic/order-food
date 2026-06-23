from fastapi import Depends, HTTPException
from app.middleware.auth import authenticate, UserContext

def check_role(allowed_roles: list[str]):
    async def dependency(current_user: UserContext = Depends(authenticate)) -> UserContext:
        user_roles = [r.lower() for r in current_user.role]
        if not any(r in allowed_roles for r in user_roles):
            raise HTTPException(status_code=403, detail="Forbidden")
        return current_user
    return dependency

is_admin = check_role(["admin"])
is_staff = check_role(["admin", "employee", "chef"])
is_chef = check_role(["admin", "chef"])
is_employee = check_role(["admin", "employee"])
is_customer = check_role(["customer", "guest"])
