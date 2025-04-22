import datetime


def datetime_to_str(obj):
    if isinstance(obj, datetime.datetime):
        return obj.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
    else:
        return None
