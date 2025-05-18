from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
from handlers.template_handler import TemplateHandler
from commands.template_cmd import TemplateCommand, TemplateUpdateCommand, TemplateDeleteCommand
from adapters.orm.models.pg_models import Template
from dto.template_dto import TemplateDto
from dto.template_dto import TemplateDtoMapper

router = APIRouter(prefix="/api/v1/workspaces/{workspace_id}/templates", tags=["templates"])

@router.post("/", response_model=TemplateDto, status_code=status.HTTP_201_CREATED)
async def create_template(command: TemplateCommand):
    handler = TemplateHandler()
    try:
        template = handler.create_template(command)
        return TemplateDtoMapper.map_to_template_dto(template)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{template_id}", response_model=TemplateDto)
async def update_template(template_id: str, command: TemplateUpdateCommand):
    handler = TemplateHandler()
    try:
        command.template_id = template_id
        template = handler.update_template(command)
        return TemplateDtoMapper.map_to_template_dto(template)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(template_id: str, workspace_id: str):
    handler = TemplateHandler()
    try:
        command = TemplateDeleteCommand(template_id=template_id, workspace_id=workspace_id)
        handler.delete_template(command)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{template_id}", response_model=TemplateDto)
async def get_template(template_id: str):
    handler = TemplateHandler()
    try:
        template = handler.get_template(template_id)
        return TemplateDtoMapper.map_to_template_dto(template)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[TemplateDto])
async def list_templates(workspace_id: str):
    handler = TemplateHandler()
    try:
        templates = handler.list_templates(workspace_id)
        return [TemplateDtoMapper.map_to_template_dto(template) for template in templates]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 