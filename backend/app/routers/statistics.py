from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import get_db
from app.middleware.auth import authenticate, UserContext
from app.middleware.rbac import is_staff
from app.models.order import Order
from app.utils.response import send_response
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from app.schemas.common import ApiResponse

router = APIRouter()

PERIOD_DAYS = {"3d": 3, "7d": 7, "1m": 30, "3m": 90, "6m": 180, "1y": 365}

def group_by_for_days(days: int) -> str:
    if days <= 31:
        return "day"
    if days <= 90:
        return "week"
    return "month"

@router.get("/statistics/orders", response_model=ApiResponse[Any])
async def order_statistics(
    from_: Optional[str] = None,
    to_: Optional[str] = None,
    period: str = "7d",
    current_user: UserContext = Depends(is_staff),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    if from_ and to_:
        from_dt = datetime.fromisoformat(from_)
        to_dt = datetime.fromisoformat(to_).replace(hour=23, minute=59, second=59)
        period_label = "custom"
    else:
        days = PERIOD_DAYS.get(period, 7)
        from_dt = now - timedelta(days=days)
        to_dt = now
        period_label = period

    diff_days = (to_dt - from_dt).days
    group_by = group_by_for_days(diff_days)
    trunc_unit = group_by

    # Summary aggregation
    summary_sql = text("""
        SELECT
            COUNT(*) FILTER (WHERE deleted = false) AS total_orders,
            COUNT(*) FILTER (WHERE deleted = false AND status = 'Cancelled') AS cancelled_orders,
            COUNT(*) FILTER (WHERE deleted = false AND is_paid = true) AS paid_orders,
            COALESCE(SUM(CASE WHEN deleted = false AND status != 'Cancelled' THEN total ELSE 0 END), 0) AS total_revenue,
            COALESCE(SUM(CASE WHEN deleted = false AND is_paid = true THEN total ELSE 0 END), 0) AS paid_revenue
        FROM orders
        WHERE created >= :from_dt AND created <= :to_dt
    """)
    summary_result = await db.execute(summary_sql, {"from_dt": from_dt, "to_dt": to_dt})
    row = summary_result.fetchone()
    total_orders = int(row.total_orders or 0)
    cancelled_orders = int(row.cancelled_orders or 0)
    paid_orders = int(row.paid_orders or 0)
    total_revenue = int(row.total_revenue or 0)
    paid_revenue = int(row.paid_revenue or 0)
    active_orders = total_orders - cancelled_orders
    avg_order_value = round(total_revenue / active_orders) if active_orders > 0 else 0

    # Orders by status
    status_sql = text("""
        SELECT status, COUNT(*) AS cnt
        FROM orders
        WHERE deleted = false AND created >= :from_dt AND created <= :to_dt
        GROUP BY status
    """)
    status_result = await db.execute(status_sql, {"from_dt": from_dt, "to_dt": to_dt})
    orders_by_status = {r.status: int(r.cnt) for r in status_result.fetchall()}

    # Revenue time-series
    timeseries_sql = text(f"""
        SELECT
            DATE_TRUNC('{trunc_unit}', created) AS period,
            COUNT(*)::bigint AS order_count,
            SUM(CASE WHEN status != 'Cancelled' THEN COALESCE(total, 0) ELSE 0 END)::bigint AS revenue
        FROM orders
        WHERE deleted = false AND created >= :from_dt AND created <= :to_dt
        GROUP BY 1
        ORDER BY 1 ASC
    """)
    ts_result = await db.execute(timeseries_sql, {"from_dt": from_dt, "to_dt": to_dt})
    revenue_by_period = []
    for r in ts_result.fetchall():
        d = r.period
        if hasattr(d, "strftime"):
            if group_by == "day":
                label = d.strftime("%d/%m")
            elif group_by == "week":
                label = f"T{d.strftime('%d/%m')}"
            else:
                label = d.strftime("%m/%Y")
        else:
            label = str(d)
        revenue_by_period.append({
            "label": label,
            "orders": int(r.order_count or 0),
            "revenue": int(r.revenue or 0),
        })

    return send_response(
        data={
            "summary": {
                "totalOrders": total_orders,
                "activeOrders": active_orders,
                "cancelledOrders": cancelled_orders,
                "paidOrders": paid_orders,
                "totalRevenue": total_revenue,
                "paidRevenue": paid_revenue,
                "avgOrderValue": avg_order_value,
            },
            "ordersByStatus": orders_by_status,
            "revenueByPeriod": revenue_by_period,
            "period": period_label,
            "groupBy": group_by,
        },
        message="Lấy thống kê thành công",
        message_en="Statistics retrieved successfully",
    )
