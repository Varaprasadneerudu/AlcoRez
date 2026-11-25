# ⚛️ AlcoRez Frontend Architecture & Component Manual

The AlcoRez customer and merchant application is built with **React 19 + Vite + Tailwind CSS v4 + React Router v7 + TanStack Query**.

---

## 📁 Source Organization

```
frontend/src/
├── components/                      # Reusable UI component library
│   ├── layout/                      # Structural application framing
│   │   ├── Navbar.jsx               # Header with search, zone picker, cart, language toggle
│   │   ├── Footer.jsx               # Statutory legal footer & excise disclaimers
│   │   ├── ScrollToTop.jsx          # Route change auto-scroll helper
│   │   ├── StatutoryBanner.jsx      # Sticky 21+ excise compliance warning
│   │   ├── AlcoRezLogo.jsx          # Vector platform logo & brand mark
│   │   └── index.js                 # Layout components barrel
│   ├── cards/                       # Domain display cards
│   │   ├── ProductCard.jsx          # Liquor item card with size selector & stock badge
│   │   ├── RetailerCard.jsx         # Licensed store card with excise license badge
│   │   └── index.js                 # Cards barrel
│   ├── modals/                      # Modals, drawers, and overlays
│   │   ├── LegalAgeModal.jsx        # Statutory 21+ entry age gate
│   │   ├── CartDrawer.jsx           # Slide-out reservation cart panel
│   │   ├── NotificationCenter.jsx   # In-app real-time notification drawer
│   │   └── index.js                 # Modals barrel
│   └── index.js                     # Master UI component barrel export
│
├── context/                         # Global React state providers
│   ├── AuthContext.jsx              # JWT session, user role, login/logout & token refresh
│   ├── CartContext.jsx              # 0ms optimistic cart updates, quantity sync, rollback
│   ├── FavoritesContext.jsx         # Wishlisted products and favorite retailers
│   ├── LanguageContext.jsx          # English ↔ Telugu instant bilingual translation
│   ├── LocationContext.jsx          # Hyderabad Telangana excise zones (Madhapur, Hitec, Banjara...)
│   └── ThemeContext.jsx             # Light / Dark theme persistence
│
├── pages/                           # Application screens organized by domain & role
│   ├── public/                      # Open public views
│   │   ├── HomePage.jsx             # Hero, category pills, featured spirits, top licensed stores
│   │   ├── ComplianceInfoPage.jsx   # Telangana Excise Act 1968 legal posture & disclosures
│   │   └── index.js
│   ├── auth/                        # User onboarding & authentication
│   │   ├── LoginPage.jsx            # Multi-role sign in with demo account shortcuts
│   │   ├── RegisterPage.jsx         # 21+ verified customer sign up
│   │   └── index.js
│   ├── customer/                    # Discovery, shopping & order tracking
│   │   ├── CatalogPage.jsx          # Search, category, size, price, and store filtering
│   │   ├── ProductDetailPage.jsx    # Multi-store availability, sizes, image gallery
│   │   ├── CartPage.jsx             # Full review of cart items & price breakdowns
│   │   ├── CheckoutDemoPage.jsx     # Address selection & simulated order reservation
│   │   ├── OrdersHistoryPage.jsx    # Order history with Active/Completed/Cancelled tabs
│   │   ├── OrdersPlacedPage.jsx     # Post-checkout success review
│   │   ├── OrderConfirmationPage.jsx # Single order progression tracking & status stepper
│   │   ├── FavoritesPage.jsx        # Saved beverages and favorite wine shops
│   │   ├── RetailerDetailPage.jsx   # Store catalog, license details & store address
│   │   └── index.js
│   ├── retailer/                    # Licensed wine shop merchant portal
│   │   ├── RetailerDashboard.jsx    # Store revenue overview, active order queue
│   │   ├── RetailerInventoryPage.jsx # Product SKU listing, price & stock adjustments
│   │   ├── RetailerOrdersPage.jsx   # Order progression (Accept -> Preparing -> Ready)
│   │   ├── RetailerApplyPage.jsx    # Merchant excise license application form
│   │   └── index.js
│   ├── admin/                       # State prohibition & excise regulatory portal
│   │   ├── AdminDashboard.jsx       # State-wide transaction metrics & store count
│   │   ├── AdminRetailersPage.jsx   # License approvals, suspensions, and verifications
│   │   ├── AdminAuditPage.jsx       # Regulatory immutable audit event logs
│   │   ├── AdminCompliancePage.jsx  # Statutory checklist and fail-closed posture
│   │   └── index.js
│   └── index.js                     # Master pages barrel export
│
├── routes/
│   └── AppRoutes.jsx                # Route definitions with lazy loading & suspense fallback
│
├── services/
│   └── api.js                       # Centralized Axios/fetch client with JWT retry interceptor
│
├── utils/
│   └── imageUtils.js                # Unsplash image optimization, resizing & fallbacks
│
├── App.jsx                          # Provider hierarchy & global layout
├── index.css                        # Tailwind CSS v4 styling & dark mode tokens
└── main.jsx                         # Application entry point
```

---

## 🚀 Quickstart Commands

```bash
# 1. Install dependencies
npm install

# 2. Start local Vite development server
npm run dev

# 3. Build for production
npm run build
```
