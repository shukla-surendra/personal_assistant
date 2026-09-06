from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import date


class EmployeeCommand(BaseModel):
    workspace_id: Optional[str] = None  # Set from the URL path by the controller
    user_id: str
    job_title: Optional[str] = None
    department: Optional[str] = None
    employment_type: str = "full_time"
    status: str = "active"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    manager_id: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    leave_allocations: Optional[Dict[str, int]] = None


class EmployeeUpdateCommand(BaseModel):
    employee_id: Optional[str] = None  # Set from the URL path by the controller
    job_title: Optional[str] = None
    department: Optional[str] = None
    employment_type: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    # "" clears the manager (promotes to top of the org chart); None means
    # "leave unchanged" -- same convention Page.parent_page_id update uses.
    manager_id: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    leave_allocations: Optional[Dict[str, int]] = None
    onboarding_checklist: Optional[List[dict]] = None


class LeaveRequestCommand(BaseModel):
    workspace_id: Optional[str] = None  # Set from the URL path by the controller
    employee_id: str
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str] = None


class LeaveReviewCommand(BaseModel):
    leave_request_id: Optional[str] = None  # Set from the URL path by the controller
    reviewed_by: Optional[str] = None  # Set from the auth token by the controller
    status: str  # approved | rejected
    review_note: Optional[str] = None


class OnboardingTemplateCommand(BaseModel):
    workspace_id: Optional[str] = None  # Set from the URL path by the controller
    name: str
    items: List[str] = []


class OnboardingTemplateUpdateCommand(BaseModel):
    template_id: Optional[str] = None  # Set from the URL path by the controller
    name: Optional[str] = None
    items: Optional[List[str]] = None


class ApplyOnboardingCommand(BaseModel):
    template_id: str


class ToggleChecklistItemCommand(BaseModel):
    done: bool
