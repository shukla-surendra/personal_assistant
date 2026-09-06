from uuid import UUID
from sqlalchemy import func, case
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from adapters.orm.models.database import SessionLocal
from .models import Warehouse, Product, StockMovement
from .commands import (
    WarehouseCommand, WarehouseUpdateCommand,
    ProductCommand, ProductUpdateCommand,
    StockMovementCommand,
)
from .dto import StockLevelDto
import logging

logger = logging.getLogger(__name__)

MOVEMENT_TYPES = ("in", "out", "adjustment")


class InventoryHandler:
    def __init__(self):
        self.db = SessionLocal()

    # -- Warehouses -----------------------------------------------------

    def create_warehouse(self, command: WarehouseCommand) -> Warehouse:
        try:
            warehouse = Warehouse(
                workspace_id=UUID(command.workspace_id),
                name=command.name,
                location=command.location,
            )
            self.db.add(warehouse)
            self.db.commit()
            self.db.refresh(warehouse)
            return warehouse
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating warehouse: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create warehouse")

    def list_warehouses(self, workspace_id: str) -> list[Warehouse]:
        return self.db.query(Warehouse).filter(
            Warehouse.workspace_id == UUID(workspace_id),
            Warehouse.is_deleted == False
        ).order_by(Warehouse.created_at.asc()).all()

    def get_warehouse(self, warehouse_id: str) -> Warehouse:
        warehouse = self.db.query(Warehouse).filter(
            Warehouse.warehouse_id == UUID(warehouse_id),
            Warehouse.is_deleted == False
        ).first()
        if not warehouse:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")
        return warehouse

    def update_warehouse(self, command: WarehouseUpdateCommand) -> Warehouse:
        try:
            warehouse = self.get_warehouse(command.warehouse_id)
            if command.name is not None:
                warehouse.name = command.name
            if command.location is not None:
                warehouse.location = command.location
            self.db.commit()
            self.db.refresh(warehouse)
            return warehouse
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating warehouse: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update warehouse")

    def delete_warehouse(self, warehouse_id: str, workspace_id: str):
        try:
            warehouse = self.db.query(Warehouse).filter(
                Warehouse.warehouse_id == UUID(warehouse_id),
                Warehouse.workspace_id == UUID(workspace_id),
                Warehouse.is_deleted == False
            ).first()
            if not warehouse:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")
            warehouse.is_deleted = True
            self.db.commit()
            return True
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting warehouse: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete warehouse")

    # -- Products ---------------------------------------------------------

    def create_product(self, command: ProductCommand) -> Product:
        try:
            existing = self.db.query(Product).filter(
                Product.workspace_id == UUID(command.workspace_id),
                Product.sku == command.sku,
                Product.is_deleted == False
            ).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"SKU '{command.sku}' already exists")

            product = Product(
                workspace_id=UUID(command.workspace_id),
                sku=command.sku,
                name=command.name,
                description=command.description,
                unit=command.unit or "pcs",
                unit_price=command.unit_price,
                reorder_level=command.reorder_level,
            )
            self.db.add(product)
            self.db.commit()
            self.db.refresh(product)
            return product
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error creating product: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create product")

    def list_products(self, workspace_id: str) -> list[Product]:
        return self.db.query(Product).filter(
            Product.workspace_id == UUID(workspace_id),
            Product.is_deleted == False
        ).order_by(Product.created_at.asc()).all()

    def get_product(self, product_id: str) -> Product:
        product = self.db.query(Product).filter(
            Product.product_id == UUID(product_id),
            Product.is_deleted == False
        ).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return product

    def update_product(self, command: ProductUpdateCommand) -> Product:
        try:
            product = self.get_product(command.product_id)
            if command.sku is not None and command.sku != product.sku:
                existing = self.db.query(Product).filter(
                    Product.workspace_id == product.workspace_id,
                    Product.sku == command.sku,
                    Product.is_deleted == False,
                    Product.product_id != product.product_id
                ).first()
                if existing:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"SKU '{command.sku}' already exists")
                product.sku = command.sku
            if command.name is not None:
                product.name = command.name
            if command.description is not None:
                product.description = command.description
            if command.unit is not None:
                product.unit = command.unit
            if command.unit_price is not None:
                product.unit_price = command.unit_price
            if command.reorder_level is not None:
                product.reorder_level = command.reorder_level
            self.db.commit()
            self.db.refresh(product)
            return product
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error updating product: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update product")

    def delete_product(self, product_id: str, workspace_id: str):
        try:
            product = self.db.query(Product).filter(
                Product.product_id == UUID(product_id),
                Product.workspace_id == UUID(workspace_id),
                Product.is_deleted == False
            ).first()
            if not product:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
            product.is_deleted = True
            self.db.commit()
            return True
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error deleting product: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete product")

    # -- Stock movements ---------------------------------------------------

    def record_movement(self, command: StockMovementCommand) -> StockMovement:
        try:
            if command.movement_type not in MOVEMENT_TYPES:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"movement_type must be one of {MOVEMENT_TYPES}")
            if command.quantity == 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="quantity cannot be zero")
            if command.movement_type in ("in", "out") and command.quantity < 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="quantity must be positive for 'in'/'out' movements")

            # Both existence and workspace scoping in one check -- a
            # product/warehouse from a different workspace must 404, not
            # silently attach a movement to data it doesn't own.
            product = self.db.query(Product).filter(
                Product.product_id == UUID(command.product_id),
                Product.workspace_id == UUID(command.workspace_id),
                Product.is_deleted == False
            ).first()
            if not product:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
            warehouse = self.db.query(Warehouse).filter(
                Warehouse.warehouse_id == UUID(command.warehouse_id),
                Warehouse.workspace_id == UUID(command.workspace_id),
                Warehouse.is_deleted == False
            ).first()
            if not warehouse:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")

            if command.movement_type == "out":
                on_hand = self._quantity_on_hand(command.workspace_id, command.product_id, command.warehouse_id)
                if on_hand < command.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Cannot remove {command.quantity} units -- only {on_hand} on hand"
                    )

            movement = StockMovement(
                workspace_id=UUID(command.workspace_id),
                product_id=UUID(command.product_id),
                warehouse_id=UUID(command.warehouse_id),
                movement_type=command.movement_type,
                quantity=command.quantity,
                reference=command.reference,
                created_by=UUID(command.created_by),
            )
            self.db.add(movement)
            self.db.commit()
            self.db.refresh(movement)
            return movement
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Error recording stock movement: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to record stock movement")

    def list_movements(self, workspace_id: str, product_id: str = None, warehouse_id: str = None) -> list[StockMovement]:
        query = self.db.query(StockMovement).filter(StockMovement.workspace_id == UUID(workspace_id))
        if product_id:
            query = query.filter(StockMovement.product_id == UUID(product_id))
        if warehouse_id:
            query = query.filter(StockMovement.warehouse_id == UUID(warehouse_id))
        return query.order_by(StockMovement.created_at.desc()).all()

    def _quantity_on_hand(self, workspace_id: str, product_id: str, warehouse_id: str) -> int:
        signed_qty = case(
            (StockMovement.movement_type == "out", -StockMovement.quantity),
            else_=StockMovement.quantity,
        )
        total = self.db.query(func.coalesce(func.sum(signed_qty), 0)).filter(
            StockMovement.workspace_id == UUID(workspace_id),
            StockMovement.product_id == UUID(product_id),
            StockMovement.warehouse_id == UUID(warehouse_id),
        ).scalar()
        return int(total)

    def get_stock_levels(self, workspace_id: str) -> list[StockLevelDto]:
        products = self.list_products(workspace_id)
        warehouses = self.list_warehouses(workspace_id)

        signed_qty = case(
            (StockMovement.movement_type == "out", -StockMovement.quantity),
            else_=StockMovement.quantity,
        )
        rows = self.db.query(
            StockMovement.product_id,
            StockMovement.warehouse_id,
            func.sum(signed_qty).label("qty"),
        ).filter(
            StockMovement.workspace_id == UUID(workspace_id)
        ).group_by(StockMovement.product_id, StockMovement.warehouse_id).all()
        qty_by_pair = {(str(r.product_id), str(r.warehouse_id)): int(r.qty) for r in rows}

        levels = []
        for product in products:
            for warehouse in warehouses:
                qty = qty_by_pair.get((str(product.product_id), str(warehouse.warehouse_id)), 0)
                levels.append(StockLevelDto(
                    product_id=str(product.product_id),
                    product_name=product.name,
                    sku=product.sku,
                    warehouse_id=str(warehouse.warehouse_id),
                    warehouse_name=warehouse.name,
                    quantity_on_hand=qty,
                    reorder_level=product.reorder_level,
                    low_stock=product.reorder_level is not None and qty <= product.reorder_level,
                ))
        return levels

    def __del__(self):
        self.db.close()
