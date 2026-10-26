# Telangana Liquor Marketplace Platform

A production-minded alcoholic beverage discovery and licensed retail wine shop marketplace platform tailored for Telangana, India. Inspired by modern Indian quick-commerce interfaces (Swiggy, Zomato), the application provides separate role-based interfaces for **Customers**, **Licensed Retailers**, and **State Prohibition & Excise Administrators**.

---

## ⚖️ Critical Legal & Regulatory Architecture (Telangana Excise Compliance)

Under the **Telangana Excise Act, 1968** and applicable state notifications:
- Commercial alcohol sales, transport, and delivery are strictly regulated by the Telangana State Prohibition & Excise Department.
- Doorstep home delivery and online consumer checkout are not legally sanctioned under standard retail wine shop (Form A4) licensing conditions.
- **Fail-Safe / Fail-Closed Architecture:**
  - The platform configuration defaults to:
    ```ini
    ALCOHOL_TRANSACTIONS_ENABLED=false
    DEMO_MODE=true
    ```
  - **When disabled (default):**
    - Product browsing, category filtering, and licensed shop discovery: **ALLOWED**
    - Adding items to cart and testing cart calculations: **ALLOWED**
    - Simulated test checkout and test orders: **ALLOWED**
    - Real payments via live banking gateways: **STRICTLY BLOCKED (403 Forbidden)**
    - Live alcohol order fulfillment and delivery dispatch: **STRICTLY BLOCKED (403 Forbidden)**
  - All test orders snapshot historical item names and prices to preserve immutable auditing.
  - A statutory 21+ age verification gate greets all visitors upon initial load.

---

## 🚀 Technology Stack

### Frontend
- **Framework:** React 19 + JavaScript with Vite tooling
- **Styling:** Tailwind CSS (v4 with `@tailwindcss/vite`)
- **Routing:** React Router v7 (`react-router-dom`)
- **Server State & Data Fetching:** TanStack Query (`@tanstack/react-query`)
- **Forms & Validation:** React Hook Form + Zod
- **Icons:** Lucide React
- **Aesthetic:** Indian quick-commerce styling with warm amber tones, verified excise badges, and glassmorphism

### Backend
- **Framework:** Python 3.14 + FastAPI
- **Validation:** Pydantic v2 + Pydantic Settings
- **ORM & Database:** SQLAlchemy 2.x with session dependency injection
- **Migrations:** Alembic
- **Database Engine:** SQLite (with WAL mode for zero-setup local dev) and PostgreSQL (via `DATABASE_URL`)
- **Authentication & Security:** JWT Access & Refresh token rotation, bcrypt password hashing, role-based access control (RBAC)
- **Testing:** Pytest + FastAPI TestClient + HTTPX

---

## 📁 Repository Structure

```
alcodelivery/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entry, CORS & compliance handlers
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic BaseSettings & compliance flags
│   │   │   ├── database.py          # SQLAlchemy 2.0 Engine & SessionLocal
│   │   │   ├── security.py          # Bcrypt hashing & PyJWT token rotation
│   │   │   └── compliance.py        # Centralized legal enforcement & fail-closed guards
│   │   ├── models/                  # SQLAlchemy 2.0 Declarative Models
│   │   │   ├── base.py              # TimeStampedUUIDModel
│   │   │   ├── user.py              # User, UserRole, CustomerProfile, Address
│   │   │   ├── retailer.py          # Retailer, RetailerStatus, RetailerLicense, RetailerMembership
│   │   │   ├── product.py           # Category, Product, ProductImage, Inventory
│   │   │   ├── order.py             # Cart, CartItem, Order, OrderItem, PaymentAttempt
│   │   │   └── compliance.py        # ComplianceApproval, ServiceArea, AuditLog, Notification
│   │   ├── schemas/                 # Pydantic request / response schemas
│   │   │   ├── auth.py
│   │   │   ├── customer.py
│   │   │   ├── catalog.py
│   │   │   ├── cart.py
│   │   │   ├── order.py
│   │   │   ├── retailer.py
│   │   │   └── admin.py
│   │   ├── api/
│   │   │   ├── deps.py              # Dependency injection & RBAC role checks
│   │   │   └── v1/
│   │   │       ├── api_router.py    # Master router
│   │   │       ├── auth.py          # /auth endpoints
│   │   │       ├── customer.py      # /customer addresses & profile
│   │   │       ├── products.py      # /products & /categories
│   │   │       ├── cart.py          # /cart item management
│   │   │       ├── orders.py        # /test-orders & simulated checkout
│   │   │       ├── retailer_portal.py # /retailer onboarding & inventory
│   │   │       ├── admin.py         # /admin review & audit trails
│   │   │       └── health.py        # /health & /compliance-status
│   │   ├── services/                # Business logic services
│   │   │   ├── auth_service.py
│   │   │   ├── catalog_service.py
│   │   │   ├── cart_service.py
│   │   │   ├── order_service.py
│   │   │   ├── retailer_service.py
│   │   │   ├── admin_service.py
│   │   │   └── audit_service.py
│   │   └── tests/                   # Automated Pytest Suite
│   ├── alembic/                     # Database migrations
│   ├── requirements.txt
│   └── seed_data.py                 # Seed catalog & Telangana retail fixtures
├── frontend/
│   ├── src/
│   │   ├── components/              # Navbar, Footer, LegalAgeModal, ProductCard, RetailerCard
│   │   ├── context/                 # AuthContext & CartContext
│   │   ├── pages/                   # Customer, Retailer, and Admin pages
│   │   ├── routes/                  # AppRoutes.jsx
│   │   ├── services/                # api.js client abstraction
│   │   ├── App.jsx
│   │   └── index.css                # Tailwind CSS styling
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js v18+ and npm
- Optional: PostgreSQL service or Docker

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed initial test data (Users, Categories, Products, Licensed Retailers)
python seed_data.py

# Start FastAPI development server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now running at `http://127.0.0.1:8000`.
- Interactive Swagger OpenAPI Docs: `http://127.0.0.1:8000/docs`
- ReDoc Documentation: `http://127.0.0.1:8000/redoc`
- Public Compliance Status: `http://127.0.0.1:8000/api/v1/compliance-status`

### 3. Frontend Setup
```bash
# Navigate to frontend in a new terminal
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start Vite development server
npm run dev
```
The frontend is now running at `http://127.0.0.1:5173`.

---

## 🔑 Pre-Seeded Demonstration Accounts

The navigation bar features a **Quick Demo Switcher** dropdown allowing you to switch personas with a single click:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Excise Administrator** | `admin@telanganaliquor.gov.mock` | `Admin@123456` | State Excise Dept officer. Can approve/suspend retailers, inspect audit logs, view platform metrics. |
| **Licensed Retailer 1** | `retailer@madhapurwines.mock` | `Retailer@123456` | *Madhapur Premium Wines & Spirits* (A4 License: `TS-HYD-A4-2024-0891`). Approved status. |
| **Licensed Retailer 2** | `retailer@jubileewines.mock` | `Retailer@123456` | *Jubilee Hills Cellars & Malts* (A4 License: `TS-HYD-A4-2024-1102`). Approved status. |
| **Pending Retailer 3** | `retailer@gachibowliwines.mock` | `Retailer@123456` | *Gachibowli Beverage Boutique* (`PENDING_REVIEW` status, awaiting admin verification). |
| **Customer** | `customer@demo.com` | `Customer@123456` | *Ravi Teja Varma*. Age 21+ verified customer with saved Hyderabad delivery addresses. |

---

## 🧪 Automated Testing

Run the full automated backend test suite:
```bash
python -m pytest backend/app/tests/ -v
```

### Test Suite Coverage:
- `test_auth.py`: Registration, login, token refresh, statutory 21+ age rejection for minors.
- `test_isolation.py`: Retailer inventory isolation (retailer A cannot alter retailer B's inventory), customer cart privacy.
- `test_catalog_cart_order.py`: Product search, multi-faceted filtering, cart total calculations, simulated checkout, order state machine (`CREATED -> CONFIRMED -> PREPARING -> READY -> COMPLETED`), and invalid transition rejection.
- `test_compliance.py`: Strict enforcement that `ALCOHOL_TRANSACTIONS_ENABLED=false` blocks real payments and live delivery assignment with 403 Forbidden.
- `test_retailer_workflow.py`: Retailer onboarding application submission (`PENDING_REVIEW` default), admin approval, license verification, and inventory publishing.

---

## 🌐 Application Routes

### Customer Views
- `/`: Home page with quick discovery chips, category grid, verified retailers, popular brands.
- `/products`: Full searchable and filterable catalogue (by category, retailer, bottle size, price).
- `/products/:id`: Detailed product page with retailer availability, bottle sizes, and statutory notice.
- `/cart`: Shopping cart with item quantity controls and transparent summary.
- `/checkout-demo`: Simulated test checkout with Hyderabad address selector and simulated payment gateway.
- `/orders/:id`: Real-time simulated order tracker with state machine progression and snapshotted prices.
- `/orders`: Customer's past simulated orders.
- `/compliance-info`: Statutory regulatory disclosure under Telangana Excise Act.
- `/login`: User login with 1-click demo persona switcher.
- `/register`: 21+ customer registration with birthdate verification.

### Retailer Portal
- `/retailer`: Dashboard displaying shop status, license number (`TS-HYD-A4-...`), and inventory metrics.
- `/retailer/inventory`: Product catalogue manager with inline price/stock adjustments and SKU creation.
- `/retailer/orders`: Simulated order fulfillment lifecycle manager.
- `/retailer/apply`: Retailer license onboarding application.

### Administrator Portal
- `/admin`: State Excise oversight dashboard with platform analytics and compliance posture.
- `/admin/retailers`: Retailer review portal for inspecting licenses and approving/suspending shops.
- `/admin/audit-logs`: Immutable chronological regulatory audit trail.
- `/admin/compliance`: Statutory excise requirement checklist.

---

## 🐳 Docker Deployment

To launch the full stack with PostgreSQL:
```bash
docker-compose up --build
```
Services started:
- `alcodelivery_postgres`: PostgreSQL 16 on port 5432
- `alcodelivery_backend`: FastAPI backend on port 8000
- `alcodelivery_frontend`: React Vite frontend on port 5173
