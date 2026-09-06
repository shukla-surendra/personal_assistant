from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime


class EmployeeDto(BaseModel):
    employee_id: str
    workspace_id: str
    user_id: str
    job_title: Optional[str] = None
    department: Optional[str] = None
    employment_type: str
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    leave_allocations: Dict[str, Any] = {}
    onboarding_checklist: List[dict] = []
    user: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class LeaveRequestDto(BaseModel):
    leave_request_id: str
    workspace_id: str
    employee_id: str
    employee_name: Optional[str] = None
    leave_type: str
    start_date: date
    end_date: date
    days: int
    reason: Optional[str] = None
    status: str
    reviewed_by: Optional[str] = None
    reviewer_name: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class LeaveBalanceDto(BaseModel):
    leave_type: str
    allocated: int
    used: int
    remaining: int


class OnboardingTemplateDto(BaseModel):
    template_id: str
    workspace_id: str
    name: str
    items: List[str] = []
    created_at: datetime
    updated_at: datetime


def _full_name(user) -> Optional[str]:
    if not user:
        return None
    return f"{user.first_name} {user.last_name}"


class HrDtoMapper:
    @staticmethod
    def map_employee(employee) -> EmployeeDto:
        return EmployeeDto(
            employee_id=str(employee.employee_id),
            workspace_id=str(employee.workspace_id),
            user_id=str(employee.user_id),
            job_title=employee.job_title,
            department=employee.department,
            employment_type=employee.employment_type,
            status=employee.status,
            start_date=employee.start_date,
            end_date=employee.end_date,
            manager_id=str(employee.manager_id) if employee.manager_id else None,
            manager_name=_full_name(employee.manager.user) if employee.manager and employee.manager.user else None,
            phone=employee.phone,
            location=employee.location,
            leave_allocations=employee.leave_allocations or {},
            onboarding_checklist=employee.onboarding_checklist or [],
            user={
                'user_id': str(employee.user.user_id),
                'first_name': employee.user.first_name,
                'last_name': employee.user.last_name,
                'email': employee.user.email,
                'avatar_url': employee.user.avatar_url,
            } if employee.user else None,
            created_at=employee.created_at,
            updated_at=employee.updated_at,
        )

    @staticmethod
    def map_leave_request(leave) -> LeaveRequestDto:
        return LeaveRequestDto(
            leave_request_id=str(leave.leave_request_id),
            workspace_id=str(leave.workspace_id),
            employee_id=str(leave.employee_id),
            employee_name=_full_name(leave.employee.user) if leave.employee and leave.employee.user else None,
            leave_type=leave.leave_type,
            start_date=leave.start_date,
            end_date=leave.end_date,
            days=leave.days,
            reason=leave.reason,
            status=leave.status,
            reviewed_by=str(leave.reviewed_by) if leave.reviewed_by else None,
            reviewer_name=_full_name(leave.reviewer.user) if leave.reviewer and leave.reviewer.user else None,
            reviewed_at=leave.reviewed_at,
            review_note=leave.review_note,
            created_at=leave.created_at,
            updated_at=leave.updated_at,
        )

    @staticmethod
    def map_template(template) -> OnboardingTemplateDto:
        return OnboardingTemplateDto(
            template_id=str(template.template_id),
            workspace_id=str(template.workspace_id),
            name=template.name,
            items=template.items or [],
            created_at=template.created_at,
            updated_at=template.updated_at,
        )
