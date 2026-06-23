"""
Simple filter parser that converts search strings like
'status:Received,is_paid:false' into SQLAlchemy WHERE conditions.
"""
from typing import Any, Optional

def parse_filter_string(search: Optional[str], allowed_fields: list[str], default_search_fields: list[str] = []) -> dict[str, Any]:
    """
    Parse a search string into a dict of filter conditions.
    Format: 'field:value,field2:value2' or plain text (matched against default_search_fields).
    Returns a dict suitable for building SQLAlchemy WHERE clauses.
    """
    if not search:
        return {}

    filters: dict[str, Any] = {}

    # Check if search contains field:value pairs
    if ":" in search:
        parts = search.split(",")
        for part in parts:
            if ":" in part:
                key, _, value = part.partition(":")
                key = key.strip()
                value = value.strip()
                if key in allowed_fields:
                    # Type coercion
                    if value.lower() in ("true", "false"):
                        filters[key] = value.lower() == "true"
                    elif value.isdigit():
                        filters[key] = int(value)
                    else:
                        filters[key] = value
    else:
        # Plain text search - store as __text_search for the caller to handle
        filters["__text_search"] = {"value": search, "fields": default_search_fields}

    return filters
