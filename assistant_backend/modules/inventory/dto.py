from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class WarehouseDto(BaseModel):
    warehouse_id: str
    workspace_id: str
    name: str
    location: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ProductDto(BaseModel):
    product_id: str
    workspace_id: str
    sku: str
    name: str
    description: Optional[str] = None
    unit: str
    unit_price: Optional[float] = None
    reorder_level: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class StockMovementDto(BaseModel):
    movement_id: str
    workspace_id: str
    product_id: str
    warehouse_id: str
    movement_type: str
    quantity: int
    reference: Optional[str] = None
    created_by: str
    created_at: datetime


class StockLevelDto(BaseModel):
    product_id: str
    product_name: str
    sku: str
    warehouse_id: str
    warehouse_name: str
    quantity_on_hand: int
    reorder_level: Optional[int] = None
    low_stock: bool


class InventoryDtoMapper:
    @staticmethod
    def map_warehouse(warehouse) -> WarehouseDto:
        return WarehouseDto(
            warehouse_id=str(warehouse.warehouse_id),
            workspace_id=str(warehouse.workspace_id),
            name=warehouse.name,
            location=warehouse.location,
            created_at=warehouse.created_at,
            updated_at=warehouse.updated_at,
        )

    @staticmethod
    def map_product(product) -> ProductDto:
        return ProductDto(
            product_id=str(product.product_id),
            workspace_id=str(product.workspace_id),
            sku=product.sku,
            name=product.name,
            description=product.description,
            unit=product.unit,
            unit_price=float(product.unit_price) if product.unit_price is not None else None,
            reorder_level=product.reorder_level,
            created_at=product.created_at,
            updated_at=product.updated_at,
        )

    @staticmethod
    def map_movement(movement) -> StockMovementDto:
        return StockMovementDto(
            movement_id=str(movement.movement_id),
            workspace_id=str(movement.workspace_id),
            product_id=str(movement.product_id),
            warehouse_id=str(movement.warehouse_id),
            movement_type=movement.movement_type,
            quantity=movement.quantity,
            reference=movement.reference,
            created_by=str(movement.created_by),
            created_at=movement.created_at,
        )
