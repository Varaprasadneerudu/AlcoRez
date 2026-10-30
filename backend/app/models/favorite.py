from app.models.base import TimeStampedUUIDModel
from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship


class FavoriteProduct(TimeStampedUUIDModel):
    __tablename__ = "favorite_products"
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_user_product_favorite"),
    )

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)

    user = relationship("User", back_populates="favorite_products")
    product = relationship("Product")

class FavoriteRetailer(TimeStampedUUIDModel):
    __tablename__ = "favorite_retailers"
    __table_args__ = (
        UniqueConstraint("user_id", "retailer_id", name="uq_user_retailer_favorite"),
    )

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    retailer_id: Mapped[str] = mapped_column(String(36), ForeignKey("retailers.id", ondelete="CASCADE"), nullable=False, index=True)

    user = relationship("User", back_populates="favorite_retailers")
    retailer = relationship("Retailer")
