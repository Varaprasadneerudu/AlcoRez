# 🐍 AlcoRez Backend Architecture & Developer Manual

The AlcoRez backend is built with **Python 3.14 + FastAPI + SQLAlchemy 2.0 + Pydantic v2**, enforcing statutory compliance under the **Telangana Excise Act, 1968**.

---

## 📁 Package Organization

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/                      # HTTP endpoint controllers
│   │   │   ├── admin.py             # Government excise review, statutory audits
│   │   │   ├── auth.py              # JWT login, refresh rotation, logout, me
│   │   │   ├── cart.py              # Cart reservations & item modifications
│   │   │   ├── customer.py          # Customer addresses, age verification & favorites
│   │   │   ├── delivery.py          # Partner duty status, order pickup & delivery OTP
│   │   │   ├── health.py            # Uptime check & compliance posture report
│   │   │   ├── notifications.py     # In-app notification center
│   │   │   ├── orders.py            # Simulated test orders & order cancellation
│   │   │   ├── products.py          # Public product & category catalog
│   │   │   └── retailer_portal.py   # Shop onboarding, license upload & inventory
│   │   ├── deps.py                  # RBAC dependencies (get_current_user, get_db, etc.)
│   │   ├── __init__.py              # Package entry point
│   │
│   ├── core/                        # Infrastructure, settings & security
│   │   ├── compliance.py            # Statutory compliance checks (fail-closed posture)
│   │   ├── config.py                # Environment configurations (Settings class)
│   │   ├── database.py              # SQLAlchemy engine, SessionLocal & get_db()
│   │   ├── security.py              # Password hashing & JWT access/refresh token rotation
│   │   └── __init__.py              # Core exports
│   │
│   ├── models/                      # SQLAlchemy 2.0 ORM database models
│   │   ├── base.py                  # TimeStampedUUIDModel (UUID primary keys & timestamps)
│   │   ├── compliance.py            # ComplianceApproval, AuditLog, ServiceArea, Notification
│   │   ├── favorite.py              # FavoriteProduct, FavoriteRetailer
│   │   ├── order.py                 # Cart, CartItem, Order, OrderItem, PaymentAttempt
│   │   ├── product.py               # Category, Product, ProductImage, Inventory, InventoryMovement
│   │   ├── retailer.py              # Retailer, RetailerLicense, RetailerMembership, RetailerInvitation
│   │   ├── user.py                  # User, UserRole, CustomerProfile, DeliveryPartnerProfile, RefreshToken, Address
│   │   └── __init__.py              # Model table registration barrel
│   │
│   ├── schemas/                     # Pydantic v2 validation DTOs
│   │   ├── admin.py
│   │   ├── auth.py
│   │   ├── cart.py
│   │   ├── catalog.py
│   │   ├── customer.py
│   │   ├── delivery.py
│   │   ├── notification.py
│   │   ├── order.py
│   │   ├── retailer.py
│   │   └── __init__.py              # Schema barrel export
│   │
│   ├── services/                    # Pure business logic services (DB transactions)
│   │   ├── admin_service.py         # Administrative review & dashboard metrics
│   │   ├── audit_service.py         # Immutable regulatory audit trail logger
│   │   ├── auth_service.py          # User registration, authentication & token rotation
│   │   ├── cart_service.py          # Cart calculations & stock reservation
│   │   ├── catalog_service.py       # Filtered product search & stock aggregation
│   │   ├── delivery_service.py      # Delivery partner assignments, OTP verification & payouts
│   │   ├── notification_service.py  # User notifications dispatch
│   │   ├── order_service.py         # Simulated order creation & cancellation restock
│   │   ├── retailer_service.py      # Shop onboarding & stock management
│   │   └── __init__.py              # Service layer barrel export
│   │
│   └── main.py                      # FastAPI app instance, CORS, GZip & error handlers
│
├── alembic/                         # Database schema migration history
│   ├── versions/                    # Revision migration scripts
│   └── env.py                       # Migration runtime environment
│
├── scripts/                         # Maintenance and initialization scripts
│   ├── seed_data.py                 # Seeds Telangana fixtures, retail outlets, and demo users
│   ├── bootstrap_admin.py           # Creates initial Super Admin without hardcoding
│   └── __init__.py
│
├── bootstrap_admin.py               # Backward-compatible CLI delegate
├── seed_data.py                     # Backward-compatible CLI delegate
├── requirements.txt                 # Pinned dependencies
├── Dockerfile                       # Production container image
└── alembic.ini                      # Alembic configuration
```

---

## 🚀 Quickstart Commands

```bash
# 1. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Seed demo fixtures & accounts
python scripts/seed_data.py

# 4. Start local development server
uvicorn app.main:app --reload --port 8000
```

---

## 🧪 Linting & Quality Verification

```bash
# Check code style with Ruff
ruff check backend

# Auto-format imports and style
ruff check --fix backend
```
