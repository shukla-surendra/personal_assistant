from pydantic import BaseModel, Field


class EnqueueTestMessagesCommand(BaseModel):
    """Generates synthetic load for the KEDA scaling test -- not a real
    app feature, an admin/load-generation utility."""
    count: int = Field(default=1, ge=1, le=1000)
    work_seconds: int = Field(default=2, ge=0, le=60)
    # Fraction of messages seeded with fail=true, to exercise the
    # SQS-style retry -> dead-letter path deliberately rather than only
    # ever seeing the happy path.
    fail_rate: float = Field(default=0.0, ge=0.0, le=1.0)
