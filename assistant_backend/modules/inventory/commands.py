from pydantic import BaseModel
from typing import Optional


class WarehouseCommand(BaseModel):
    workspace_id: Optional[str] = None  # Set from the URL path by the controller
    name: str
    location: Optional[str] = None


class WarehouseUpdateCommand(BaseModel):
    warehouse_id: Optional[str] = None
    name: Optional[str] = None
    location: Optional[str] = None


class ProductCommand(BaseModel):
    workspace_id: Optional[str] = None  # Set from the URL path by the controller
    sku: str
    name: str
    description: Optional[str] = None
    unit: str = "pcs"
    unit_price: Optional[float] = None
    reorder_level: Optional[int] = None


class ProductUpdateCommand(BaseModel):
    product_id: Optional[str] = None
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    reorder_level: Optional[int] = None


class StockMovementCommand(BaseModel):
    workspace_id: Optional[str] = None  # Set from the URL path by the controller
    created_by: Optional[str] = None  # Set from the auth token by the controller
    product_id: str
    warehouse_id: str
    movement_type: str  # in | out | adjustment
    quantity: int
    reference: Optional[str] = None
