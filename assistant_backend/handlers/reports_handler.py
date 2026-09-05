from datetime import datetime, timedelta
from uuid import UUID
from collections import defaultdict

from sqlalchemy import func
from adapters.orm.models.pg_models import Task
from adapters.orm.models.database import SessionLocal


WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


class ReportsHandler:
    """Real aggregation over the tasks table -- no mocked numbers. Every
    number here is computed from actual rows, scoped to one workspace."""

    def __init__(self):
        self.db = SessionLocal()

    def get_summary(self, workspace_id: str) -> dict:
        return {
            "task_completion": self._task_completion(workspace_id),
            "time_distribution": self._time_distribution(workspace_id),
            "performance_trends": self._performance_trends(workspace_id),
            "schedule_analysis": self._schedule_analysis(workspace_id),
        }

    def _task_completion(self, workspace_id: str) -> dict:
        ws_id = UUID(workspace_id)
        base = self.db.query(Task).filter(Task.workspace_id == ws_id, Task.is_deleted == False)

        total = base.count()
        completed = base.filter(Task.completed == True).count()
        completion_rate = round((completed / total) * 100, 1) if total else 0.0

        # Daily completions for the last 7 days -- a real trend line, not a
        # single snapshot number.
        since = datetime.utcnow() - timedelta(days=6)
        rows = (
            self.db.query(func.date(Task.updated_at).label("day"), func.count(Task.task_id))
            .filter(
                Task.workspace_id == ws_id,
                Task.completed == True,
                Task.updated_at >= since,
            )
            .group_by("day")
            .all()
        )
        by_day = {str(day): count for day, count in rows}
        labels = [(since + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
        trend = [by_day.get(day, 0) for day in labels]

        return {
            "total_tasks": total,
            "completed_tasks": completed,
            "completion_rate": completion_rate,
            "trend_labels": [datetime.strptime(d, "%Y-%m-%d").strftime("%a") for d in labels],
            "trend_values": trend,
        }

    def _time_distribution(self, workspace_id: str) -> dict:
        ws_id = UUID(workspace_id)
        rows = (
            self.db.query(Task.priority, func.count(Task.task_id))
            .filter(Task.workspace_id == ws_id, Task.is_deleted == False)
            .group_by(Task.priority)
            .all()
        )
        counts = {str(priority or "unset"): count for priority, count in rows}
        return {
            "labels": list(counts.keys()),
            "values": list(counts.values()),
        }

    def _performance_trends(self, workspace_id: str) -> dict:
        """Completion rate per week, last 6 weeks."""
        ws_id = UUID(workspace_id)
        weeks = 6
        now = datetime.utcnow()
        start = now - timedelta(weeks=weeks)

        rows = (
            self.db.query(Task.created_at, Task.completed)
            .filter(Task.workspace_id == ws_id, Task.is_deleted == False, Task.created_at >= start)
            .all()
        )

        buckets = defaultdict(lambda: {"total": 0, "completed": 0})
        for created_at, completed in rows:
            week_index = (now - created_at).days // 7
            week_index = min(max(week_index, 0), weeks - 1)
            buckets[week_index]["total"] += 1
            if completed:
                buckets[week_index]["completed"] += 1

        labels = []
        values = []
        for i in range(weeks - 1, -1, -1):
            b = buckets[i]
            rate = round((b["completed"] / b["total"]) * 100, 1) if b["total"] else 0.0
            labels.append(f"{i+1}w ago" if i > 0 else "This week")
            values.append(rate)

        return {"labels": labels, "values": values}

    def _schedule_analysis(self, workspace_id: str) -> dict:
        """Upcoming time_block tasks over the next 7 days -- real scheduled
        hours, not a mock."""
        ws_id = UUID(workspace_id)
        now = datetime.utcnow()
        end = now + timedelta(days=7)

        blocks = (
            self.db.query(Task.start_time, Task.end_time)
            .filter(
                Task.workspace_id == ws_id,
                Task.is_deleted == False,
                Task.task_type == "time_block",
                Task.start_time != None,
                Task.start_time >= now,
                Task.start_time <= end,
            )
            .all()
        )

        hours_by_day = defaultdict(float)
        total_hours = 0.0
        for start_time, end_time in blocks:
            if not end_time:
                continue
            hrs = (end_time - start_time).total_seconds() / 3600
            total_hours += hrs
            day_label = start_time.strftime("%a")
            hours_by_day[day_label] += hrs

        busiest_day = max(hours_by_day, key=hours_by_day.get) if hours_by_day else None

        return {
            "upcoming_blocks": len(blocks),
            "total_scheduled_hours": round(total_hours, 1),
            "busiest_day": busiest_day,
            "labels": list(hours_by_day.keys()),
            "values": [round(v, 1) for v in hours_by_day.values()],
        }

    def __del__(self):
        self.db.close()
