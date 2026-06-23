from fastapi import FastAPI
from app.routers import (
    health,
    auth,
    categories,
    menu_items,
    orders,
    cart,
    comments,
    users,
    roles,
    tables,
    statistics,
    restaurant_location,
    static_files,
    vatConfiguration,
)

API_PREFIX = "/api/v1"


def register_routers(app: FastAPI) -> None:
    app.include_router(health.router, prefix=API_PREFIX, tags=["Health"])
    app.include_router(auth.router, prefix=API_PREFIX, tags=["Auth"])
    app.include_router(categories.router, prefix=API_PREFIX, tags=["Categories"])
    app.include_router(menu_items.router, prefix=API_PREFIX, tags=["MenuItems"])
    app.include_router(orders.router, prefix=API_PREFIX, tags=["Orders"])
    app.include_router(cart.router, prefix=API_PREFIX, tags=["Cart"])
    app.include_router(comments.router, prefix=API_PREFIX, tags=["Comments"])
    app.include_router(users.router, prefix=API_PREFIX, tags=["Users"])
    app.include_router(roles.router, prefix=API_PREFIX, tags=["Roles"])
    app.include_router(tables.router, prefix=API_PREFIX, tags=["Tables"])
    app.include_router(statistics.router, prefix=API_PREFIX, tags=["Statistics"])
    app.include_router(
        restaurant_location.router, prefix=API_PREFIX, tags=["Restaurant"]
    )
    app.include_router(static_files.router, prefix=API_PREFIX, tags=["Files"])
    app.include_router(vatConfiguration.router, prefix=API_PREFIX, tags=["VAT"])
