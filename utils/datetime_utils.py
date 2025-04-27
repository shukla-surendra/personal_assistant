from datetime import datetime

def datetime_to_str(dt: datetime) -> str:
    """Convert datetime to string format."""
    if dt is None:
        return None
    return dt.isoformat()

def str_to_datetime(dt_str: str) -> datetime:
    """Convert string to datetime format."""
    if dt_str is None:
        return None
    return datetime.fromisoformat(dt_str)

def datetime_to_str_iso(obj):
    if isinstance(obj, datetime):
        return obj.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
    else:
        return None