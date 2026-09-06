import datetime
from uuid import UUID, uuid4
from sqlalchemy.orm import joinedload
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from adapters.orm.models.database import SessionLocal
from .models import Employee, LeaveRequest, OnboardingTemplate
from .commands import (
    EmployeeCommand, EmployeeUpdateCommand,
    LeaveRequestCommand, LeaveReviewCommand,
    OnboardingTemplateCommand, OnboardingTemplateUpdateCommand,
)
import logging

logger = logging.getLogger(__name__)

LEAVE_REVIEW_STATUSES = ("approved", "rejected")

_EMPLOYEE_LOAD_OPTS = (
    joinedload(Employee.user),
    joinedload(Employee.manager).joinedload(Employee.user),
)


class HrHandler:
    def __init__(self):
        self.db = SessionLocal()

    def _force_load_employee(self, employee: Employee) -> None:
        """Force-load every relationship HrDtoMapper.map_employee touches
        (user, manager, manager.user) while this handler's session is
        still open. Mutation paths that don't fetch through get_employee()
        (whose joinedload options cover this) need it explicitly, since
        the mapper runs in the controller after the handler returns and
        this session can already be closed by then."""
        _ = employee.user
        if employee.manager:
            _ = employee.manager.user

    def _force_load_leave(self, leave: LeaveRequest) -> None:
        """Same reasoning as _force_load_employee, for LeaveRequestDto's
        leave.employee.user / leave.reviewer.user accesses."""
        if leave.employee:
            _ = leave.employee.user
        if leave.reviewer:
            _ = leave.reviewer.user

    # -- Employees -----------------------------------------------------------

    def create_employee(self, command: EmployeeCommand) -> Employee:
        try:
            existing = self.db.query(Employee).filter(
                Employee.workspace_id == UUID(command.workspace_id),
                Employee.user_id == UUID(command.user_id),
                Employee.is_deleted == False,
            ).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This user already has an employee record")

            employee = Employee(
                workspace_id=UUID(command.workspace_id),
                user_id=UUID(command.user_id),
                job_title=command.job_title,
                department=command.department,
                employment_type=command.employment_type,
                status=command.status,
                start_date=command.start_date,
                end_date=command.end_date,
                manager_id=UUID(command.manager_id) if command.manager_id else None,
                phone=command.phone,
                location=command.location,
                leave_allocations=command.leave_allocations,
            )
            self.db.add(employee)
            self.db.commit()
            self.db.refresh(employee)
            self._force_load_employee(employee)
            return employee
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating employee: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create employee")

    def get_employee(self, employee_id: str) -> Employee:
        employee = self.db.query(Employee).options(*_EMPLOYEE_LOAD_OPTS).filter(
            Employee.employee_id == UUID(employee_id),
            Employee.is_deleted == False,
        ).first()
        if not employee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
        return employee

    def get_employee_by_user(self, workspace_id: str, user_id: str):
        return self.db.query(Employee).options(*_EMPLOYEE_LOAD_OPTS).filter(
            Employee.workspace_id == UUID(workspace_id),
            Employee.user_id == UUID(user_id),
            Employee.is_deleted == False,
        ).first()

    def list_employees(self, workspace_id: str) -> list[Employee]:
        return self.db.query(Employee).options(*_EMPLOYEE_LOAD_OPTS).filter(
            Employee.workspace_id == UUID(workspace_id),
            Employee.is_deleted == False,
        ).order_by(Employee.created_at.asc()).all()

    def update_employee(self, command: EmployeeUpdateCommand) -> Employee:
        try:
            employee = self.get_employee(command.employee_id)
            if command.job_title is not None:
                employee.job_title = command.job_title
            if command.department is not None:
                employee.department = command.department
            if command.employment_type is not None:
                employee.employment_type = command.employment_type
            if command.status is not None:
                employee.status = command.status
            if command.start_date is not None:
                employee.start_date = command.start_date
            if command.end_date is not None:
                employee.end_date = command.end_date
            if command.manager_id is not None:
                new_manager_id = UUID(command.manager_id) if command.manager_id else None
                if new_manager_id == employee.employee_id:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An employee cannot be their own manager")
                employee.manager_id = new_manager_id
            if command.phone is not None:
                employee.phone = command.phone
            if command.location is not None:
                employee.location = command.location
            if command.leave_allocations is not None:
                employee.leave_allocations = command.leave_allocations
            if command.onboarding_checklist is not None:
                employee.onboarding_checklist = command.onboarding_checklist

            self.db.commit()
            self.db.refresh(employee)
            self._force_load_employee(employee)
            return employee
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating employee: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update employee")

    def delete_employee(self, employee_id: str, workspace_id: str):
        try:
            employee = self.db.query(Employee).filter(
                Employee.employee_id == UUID(employee_id),
                Employee.workspace_id == UUID(workspace_id),
                Employee.is_deleted == False,
            ).first()
            if not employee:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

            # Unlink, don't cascade -- same rule Company/Epic/Sprint/Page
            # deletion already follow: direct reports get promoted rather
            # than left dangling under a deleted manager. The FK's ON
            # DELETE SET NULL never fires here since this is a soft delete.
            self.db.query(Employee).filter(Employee.manager_id == employee.employee_id).update({"manager_id": None})
            employee.is_deleted = True
            self.db.commit()
            return True
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting employee: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete employee")

    # -- Leave requests --------------------------------------------------------

    def create_leave_request(self, command: LeaveRequestCommand) -> LeaveRequest:
        try:
            if command.end_date < command.start_date:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_date cannot be before start_date")
            employee = self.db.query(Employee).filter(
                Employee.employee_id == UUID(command.employee_id),
                Employee.workspace_id == UUID(command.workspace_id),
                Employee.is_deleted == False,
            ).first()
            if not employee:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

            days = (command.end_date - command.start_date).days + 1
            leave = LeaveRequest(
                workspace_id=UUID(command.workspace_id),
                employee_id=UUID(command.employee_id),
                leave_type=command.leave_type,
                start_date=command.start_date,
                end_date=command.end_date,
                days=days,
                reason=command.reason,
                status="pending",
            )
            self.db.add(leave)
            self.db.commit()
            self.db.refresh(leave)
            self._force_load_leave(leave)
            return leave
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating leave request: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create leave request")

    def list_leave_requests(self, workspace_id: str, employee_id: str = None, status_filter: str = None) -> list[LeaveRequest]:
        query = self.db.query(LeaveRequest).options(
            joinedload(LeaveRequest.employee).joinedload(Employee.user),
            joinedload(LeaveRequest.reviewer).joinedload(Employee.user),
        ).filter(LeaveRequest.workspace_id == UUID(workspace_id))
        if employee_id:
            query = query.filter(LeaveRequest.employee_id == UUID(employee_id))
        if status_filter:
            query = query.filter(LeaveRequest.status == status_filter)
        return query.order_by(LeaveRequest.created_at.desc()).all()

    def review_leave_request(self, command: LeaveReviewCommand) -> LeaveRequest:
        try:
            if command.status not in LEAVE_REVIEW_STATUSES:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"status must be one of {LEAVE_REVIEW_STATUSES}")
            leave = self.db.query(LeaveRequest).options(
                joinedload(LeaveRequest.employee).joinedload(Employee.user),
                joinedload(LeaveRequest.reviewer).joinedload(Employee.user),
            ).filter(LeaveRequest.leave_request_id == UUID(command.leave_request_id)).first()
            if not leave:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
            if leave.status != "pending":
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Leave request already {leave.status}")

            leave.status = command.status
            leave.reviewed_by = UUID(command.reviewed_by) if command.reviewed_by else None
            leave.reviewed_at = datetime.datetime.now(datetime.UTC)
            leave.review_note = command.review_note
            self.db.commit()
            self.db.refresh(leave)
            self._force_load_leave(leave)
            return leave
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error reviewing leave request: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to review leave request")

    def cancel_leave_request(self, leave_request_id: str, workspace_id: str):
        try:
            leave = self.db.query(LeaveRequest).filter(
                LeaveRequest.leave_request_id == UUID(leave_request_id),
                LeaveRequest.workspace_id == UUID(workspace_id),
            ).first()
            if not leave:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
            if leave.status not in ("pending", "approved"):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending or approved requests can be cancelled")
            leave.status = "cancelled"
            self.db.commit()
            return True
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error cancelling leave request: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to cancel leave request")

    def get_leave_balance(self, employee_id: str) -> list[dict]:
        employee = self.get_employee(employee_id)
        allocations = employee.leave_allocations or {}
        current_year = datetime.date.today().year

        approved = self.db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == UUID(employee_id),
            LeaveRequest.status == "approved",
        ).all()
        used_by_type = {}
        for leave in approved:
            if leave.start_date.year == current_year or leave.end_date.year == current_year:
                used_by_type[leave.leave_type] = used_by_type.get(leave.leave_type, 0) + leave.days

        return [
            {
                "leave_type": leave_type,
                "allocated": allocated,
                "used": used_by_type.get(leave_type, 0),
                "remaining": allocated - used_by_type.get(leave_type, 0),
            }
            for leave_type, allocated in allocations.items()
        ]

    # -- Onboarding templates ----------------------------------------------

    def create_template(self, command: OnboardingTemplateCommand) -> OnboardingTemplate:
        try:
            template = OnboardingTemplate(
                workspace_id=UUID(command.workspace_id),
                name=command.name,
                items=command.items or [],
            )
            self.db.add(template)
            self.db.commit()
            self.db.refresh(template)
            return template
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating onboarding template: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create onboarding template")

    def list_templates(self, workspace_id: str) -> list[OnboardingTemplate]:
        return self.db.query(OnboardingTemplate).filter(
            OnboardingTemplate.workspace_id == UUID(workspace_id),
            OnboardingTemplate.is_deleted == False,
        ).order_by(OnboardingTemplate.created_at.asc()).all()

    def update_template(self, command: OnboardingTemplateUpdateCommand) -> OnboardingTemplate:
        try:
            template = self.db.query(OnboardingTemplate).filter(
                OnboardingTemplate.template_id == UUID(command.template_id),
                OnboardingTemplate.is_deleted == False,
            ).first()
            if not template:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
            if command.name is not None:
                template.name = command.name
            if command.items is not None:
                template.items = command.items
            self.db.commit()
            self.db.refresh(template)
            return template
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating onboarding template: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update onboarding template")

    def delete_template(self, template_id: str, workspace_id: str):
        try:
            template = self.db.query(OnboardingTemplate).filter(
                OnboardingTemplate.template_id == UUID(template_id),
                OnboardingTemplate.workspace_id == UUID(workspace_id),
                OnboardingTemplate.is_deleted == False,
            ).first()
            if not template:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
            template.is_deleted = True
            self.db.commit()
            return True
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting onboarding template: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete onboarding template")

    def apply_template_to_employee(self, employee_id: str, template_id: str) -> Employee:
        try:
            employee = self.get_employee(employee_id)
            template = self.db.query(OnboardingTemplate).filter(
                OnboardingTemplate.template_id == UUID(template_id),
                OnboardingTemplate.is_deleted == False,
            ).first()
            if not template:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

            employee.onboarding_checklist = [
                {"id": str(uuid4()), "text": item, "done": False} for item in (template.items or [])
            ]
            self.db.commit()
            self.db.refresh(employee)
            self._force_load_employee(employee)
            return employee
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error applying onboarding template: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to apply onboarding template")

    def toggle_checklist_item(self, employee_id: str, item_id: str, done: bool) -> Employee:
        try:
            employee = self.get_employee(employee_id)
            checklist = employee.onboarding_checklist or []
            # Build a fresh list/dicts rather than mutating in place --
            # SQLAlchemy's change tracking for a plain JSONB column compares
            # against the snapshot it took when the object was loaded. That
            # snapshot is the *same* list object our in-place mutation would
            # touch, so `employee.onboarding_checklist = checklist` (same
            # reference back) would report no change and silently skip the
            # UPDATE. A new list makes the assignment a real, detected change.
            new_checklist = []
            found = False
            for item in checklist:
                if item.get("id") == item_id:
                    new_checklist.append({**item, "done": done})
                    found = True
                else:
                    new_checklist.append(item)
            if not found:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist item not found")

            employee.onboarding_checklist = new_checklist
            self.db.commit()
            self.db.refresh(employee)
            self._force_load_employee(employee)
            return employee
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating checklist item: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update checklist item")

    def __del__(self):
        self.db.close()
