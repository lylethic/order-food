from pydantic import BaseModel
from typing import Optional

class UpsertRestaurantLocation(BaseModel):
    name: Optional[str] = None
    latitude: float
    longitude: float
    radius_meters: Optional[int] = None

class ToggleGeofence(BaseModel):
    enabled: bool
