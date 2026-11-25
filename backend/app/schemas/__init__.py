"""Pydantic Data Transfer Objects (DTOs) and Validation Schemas.

Organized by domain:
- Authentication & Users
- Product Catalog & Inventory
- Cart & Orders
- Customer Profile, Addresses & Favorites
- Retailer Onboarding & Invitations
- Delivery Partner Operations
- Administrative & Audit Governance
- Notification Center
"""

from app.schemas.admin import (
    AdminDashboardStats,
    AdminUserCreate,
    AuditLogOut,
    ComplianceApprovalOut,
    ComplianceToggleRequest,
    UserUpdateAdmin,
)
from app.schemas.auth import (
    LogoutRequest,
    PasswordResetRequest,
    RefreshTokenRequest,
    Token,
    UserLogin,
    UserOut,
    UserRegister,
)
from app.schemas.cart import CartItemAdd, CartItemOut, CartItemUpdate, CartOut
from app.schemas.catalog import (
    CategoryCreate,
    CategoryOut,
    InventoryCreate,
    InventoryCsvRowPreview,
    InventoryImportApplyItem,
    InventoryImportApplyRequest,
    InventoryImportApplyResponse,
    InventoryImportPreviewRequest,
    InventoryImportPreviewResponse,
    InventoryMovementOut,
    InventoryOut,
    InventorySummaryOut,
    InventoryUpdate,
    PaginatedInventoryResponse,
    ProductCreate,
    ProductDetailOut,
    ProductImageOut,
    ProductInventorySummary,
    ProductOut,
    StockAdjustmentRequest,
)
from app.schemas.customer import (
    AddressCreate,
    AddressOut,
    AgeVerificationRequest,
    CustomerFavoritesOut,
    CustomerProfileOut,
    CustomerProfileUpdate,
    FavoriteIdsOut,
    FavoriteProductOut,
    FavoriteRetailerOut,
)
from app.schemas.delivery import (
    AvailableDeliveryOrderOut,
    DeliveryCompleteRequest,
    DeliveryEarningsSummaryOut,
    DeliveryPartnerProfileOut,
    DeliveryStatusUpdate,
    DeliveryTripHistoryOut,
)
from app.schemas.notification import (
    NotificationListOut,
    NotificationOut,
    UnreadCountOut,
)
from app.schemas.order import (
    LivePaymentAttemptRequest,
    OrderItemOut,
    OrderOut,
    OrderStatusUpdate,
    SimulatedCheckoutRequest,
)
from app.schemas.retailer import (
    RetailerApplicationCreate,
    RetailerDashboardOut,
    RetailerInvitationCreate,
    RetailerInvitationOut,
    RetailerLicenseOut,
    RetailerOut,
    RetailerReviewRequest,
)

__all__ = [
    # Auth
    "LogoutRequest",
    "PasswordResetRequest",
    "RefreshTokenRequest",
    "Token",
    "UserLogin",
    "UserOut",
    "UserRegister",
    # Catalog & Inventory
    "CategoryCreate",
    "CategoryOut",
    "InventoryCreate",
    "InventoryCsvRowPreview",
    "InventoryImportApplyItem",
    "InventoryImportApplyRequest",
    "InventoryImportApplyResponse",
    "InventoryImportPreviewRequest",
    "InventoryImportPreviewResponse",
    "InventoryMovementOut",
    "InventoryOut",
    "InventorySummaryOut",
    "InventoryUpdate",
    "PaginatedInventoryResponse",
    "ProductCreate",
    "ProductDetailOut",
    "ProductImageOut",
    "ProductInventorySummary",
    "ProductOut",
    "StockAdjustmentRequest",
    # Cart
    "CartItemAdd",
    "CartItemOut",
    "CartItemUpdate",
    "CartOut",
    # Order
    "LivePaymentAttemptRequest",
    "OrderItemOut",
    "OrderOut",
    "OrderStatusUpdate",
    "SimulatedCheckoutRequest",
    # Customer
    "AddressCreate",
    "AddressOut",
    "AgeVerificationRequest",
    "CustomerFavoritesOut",
    "CustomerProfileOut",
    "CustomerProfileUpdate",
    "FavoriteIdsOut",
    "FavoriteProductOut",
    "FavoriteRetailerOut",
    # Retailer
    "RetailerApplicationCreate",
    "RetailerDashboardOut",
    "RetailerInvitationCreate",
    "RetailerInvitationOut",
    "RetailerLicenseOut",
    "RetailerOut",
    "RetailerReviewRequest",
    # Delivery
    "AvailableDeliveryOrderOut",
    "DeliveryCompleteRequest",
    "DeliveryEarningsSummaryOut",
    "DeliveryPartnerProfileOut",
    "DeliveryStatusUpdate",
    "DeliveryTripHistoryOut",
    # Admin
    "AdminDashboardStats",
    "AdminUserCreate",
    "AuditLogOut",
    "ComplianceApprovalOut",
    "ComplianceToggleRequest",
    "UserUpdateAdmin",
    # Notification
    "NotificationListOut",
    "NotificationOut",
    "UnreadCountOut",
]
