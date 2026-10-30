import os
import sys
from datetime import date, datetime, timezone
from decimal import Decimal

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.compliance import ComplianceApproval, ServiceArea
from app.models.product import Category, Inventory, Product, ProductImage
from app.models.retailer import (
    Retailer,
    RetailerLicense,
    RetailerStatus,
)
from app.models.user import Address, CustomerProfile, User, UserRole


def seed_database(target_engine=None, target_session=None):
    print("Initializing tables...")
    eng = target_engine or engine
    Base.metadata.create_all(bind=eng)
    db = target_session() if target_session else SessionLocal()

    try:
        # Check if already seeded
        existing_admin = db.query(User).filter(User.email == "admin@telanganaliquor.gov.mock").first()
        if existing_admin:
            print("Database already contains seed data. Skipping duplicate seed.")
            return

        print("Seeding Users...")
        # 1. Admin
        admin_user = User(
            email="admin@telanganaliquor.gov.mock",
            hashed_password=hash_password("Admin@123456"),
            full_name="State Excise Administrator",
            phone="+91-40-23456789",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )
        db.add(admin_user)

        # 2. Customer
        customer_user = User(
            email="customer@demo.com",
            hashed_password=hash_password("Customer@123456"),
            full_name="Ravi Teja Varma",
            phone="+91-9876543210",
            role=UserRole.CUSTOMER,
            is_active=True,
            is_verified=True
        )
        db.add(customer_user)
        db.flush()

        # Customer Profile (age 21+ verified)
        cust_profile = CustomerProfile(
            user_id=customer_user.id,
            date_of_birth=date(1995, 8, 15),
            age_verified=True,
            id_proof_type="Aadhaar",
            id_proof_number="XXXX-XXXX-4819"
        )
        db.add(cust_profile)

        # Customer Addresses
        addr1 = Address(
            user_id=customer_user.id,
            label="Home",
            address_line1="Flat 402, Royal Palms Apartments",
            address_line2="Near Durgam Cheruvu, Madhapur",
            landmark="Opposite Inorbit Mall Road",
            city="Hyderabad",
            state="Telangana",
            postal_code="500081",
            is_default=True
        )
        addr2 = Address(
            user_id=customer_user.id,
            label="Office",
            address_line1="Level 8, Cyber Towers",
            address_line2="HITEC City Main Road",
            landmark="Near Cyber Gateway",
            city="Hyderabad",
            state="Telangana",
            postal_code="500081",
            is_default=False
        )
        db.add_all([addr1, addr2])

        # 3. Retailer 1: Madhapur Premium Wines (Approved)
        retailer1_user = User(
            email="retailer@madhapurwines.mock",
            hashed_password=hash_password("Retailer@123456"),
            full_name="K. Venkat Rao",
            phone="+91-9849012345",
            role=UserRole.RETAILER,
            is_active=True,
            is_verified=True
        )
        db.add(retailer1_user)
        db.flush()

        retailer1 = Retailer(
            user_id=retailer1_user.id,
            shop_name="Madhapur Premium Wines & Spirits",
            trade_name="Sri Balaji Wines A4 Retail",
            contact_person="K. Venkat Rao",
            phone="+91-9849012345",
            email="retailer@madhapurwines.mock",
            address_line="Plot 12, Ayyappa Society Main Road, Madhapur",
            city="Hyderabad",
            state="Telangana",
            postal_code="500081",
            status=RetailerStatus.APPROVED,
            review_notes="Verified against Telangana Excise Gazetted A4 List (Hyderabad Range)."
        )
        db.add(retailer1)
        db.flush()

        lic1 = RetailerLicense(
            retailer_id=retailer1.id,
            license_number="TS-HYD-A4-2024-0891",
            license_type="A4 Retail Wine Shop",
            issuing_authority="Prohibition & Excise Department, Govt of Telangana",
            issued_date=date(2024, 4, 1),
            expiry_date=date(2027, 3, 31),
            document_url="https://mock-storage.telangana.gov/licenses/ts-hyd-a4-0891.pdf",
            is_verified=True,
            verified_at=datetime.now(timezone.utc),
            verified_by_user_id=admin_user.id
        )
        db.add(lic1)

        # 4. Retailer 2: Jubilee Hills Cellars (Approved)
        retailer2_user = User(
            email="retailer@jubileewines.mock",
            hashed_password=hash_password("Retailer@123456"),
            full_name="M. Sudhakar Reddy",
            phone="+91-9885098765",
            role=UserRole.RETAILER,
            is_active=True,
            is_verified=True
        )
        db.add(retailer2_user)
        db.flush()

        retailer2 = Retailer(
            user_id=retailer2_user.id,
            shop_name="Jubilee Hills Cellars & Malts",
            trade_name="Jubilee Heritage Beverage Outlet",
            contact_person="M. Sudhakar Reddy",
            phone="+91-9885098765",
            email="retailer@jubileewines.mock",
            address_line="Road No. 36, Near Peddamma Temple Metro, Jubilee Hills",
            city="Hyderabad",
            state="Telangana",
            postal_code="500033",
            status=RetailerStatus.APPROVED,
            review_notes="Approved A4 License holder in Jubilee Hills Excise Circle."
        )
        db.add(retailer2)
        db.flush()

        lic2 = RetailerLicense(
            retailer_id=retailer2.id,
            license_number="TS-HYD-A4-2024-1102",
            license_type="A4 Retail Wine Shop",
            issuing_authority="Prohibition & Excise Department, Govt of Telangana",
            issued_date=date(2024, 4, 1),
            expiry_date=date(2027, 3, 31),
            document_url="https://mock-storage.telangana.gov/licenses/ts-hyd-a4-1102.pdf",
            is_verified=True,
            verified_at=datetime.now(timezone.utc),
            verified_by_user_id=admin_user.id
        )
        db.add(lic2)

        # 5. Retailer 3: Gachibowli Beverage Boutique (Pending Review)
        retailer3_user = User(
            email="retailer@gachibowliwines.mock",
            hashed_password=hash_password("Retailer@123456"),
            full_name="P. Srinivas Goud",
            phone="+91-9701234567",
            role=UserRole.RETAILER,
            is_active=True,
            is_verified=False
        )
        db.add(retailer3_user)
        db.flush()

        retailer3 = Retailer(
            user_id=retailer3_user.id,
            shop_name="Gachibowli Beverage Boutique",
            trade_name="Srinivas Wines Gachibowli",
            contact_person="P. Srinivas Goud",
            phone="+91-9701234567",
            email="retailer@gachibowliwines.mock",
            address_line="Opposite Bio-Diversity Park, Gachibowli",
            city="Hyderabad",
            state="Telangana",
            postal_code="500032",
            status=RetailerStatus.PENDING_REVIEW,
            review_notes="Application submitted online. Awaiting manual physical store verification."
        )
        db.add(retailer3)
        db.flush()

        lic3 = RetailerLicense(
            retailer_id=retailer3.id,
            license_number="TS-HYD-A4-2025-0044",
            license_type="A4 Retail Wine Shop",
            issuing_authority="Prohibition & Excise Department, Govt of Telangana",
            issued_date=date(2025, 1, 15),
            expiry_date=date(2028, 1, 14),
            document_url="https://mock-storage.telangana.gov/licenses/ts-hyd-a4-0044.pdf",
            is_verified=False
        )
        db.add(lic3)

        print("Seeding Categories...")
        categories_data = [
            ("Whisky & Single Malts", "whisky", "Finest Indian single malts, scotch, and blended whiskies", "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80"),
            ("Wine & Sparkling", "wine", "Red, white, rose, and sparkling wines from premium vineyards", "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80"),
            ("Vodka", "vodka", "Triple distilled, grain, and botanical vodkas", "https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=600&q=80"),
            ("Rum", "rum", "Dark, spiced, and golden aged rums", "https://images.unsplash.com/photo-1614313511387-1436a4480ebb?auto=format&fit=crop&w=600&q=80"),
            ("Gin & Botanicals", "gin", "Craft craft gins infused with Indian botanicals and juniper", "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80"),
            ("Beer & Cider", "beer", "Lagers, ales, wheat beers, and stouts", "https://images.unsplash.com/photo-1608270119278-65636055d7b5?auto=format&fit=crop&w=600&q=80"),
            ("Brandy & Cognac", "brandy", "Aged French cognacs and popular Indian brandies", "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=600&q=80"),
        ]

        cat_map = {}
        for name, slug, desc, img in categories_data:
            cat = Category(name=name, slug=slug, description=desc, image_url=img, is_active=True)
            db.add(cat)
            db.flush()
            cat_map[slug] = cat.id

        print("Seeding Products and Retailer Inventories...")
        products_data = [
            # Whisky
            ("Amrut Fusion Single Malt", "Amrut", "whisky", "Award-winning Indian single malt whisky crafted from barley grown at the foothills of the Himalayas.", "50.0% ABV", "India", "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("4850.00"), 18), ("375ml", Decimal("2550.00"), 12)]),
            ("Paul John Nirvana Single Malt", "Paul John", "whisky", "Goan unpeated single malt offering delicate honeyed honeycomb and subtle vanilla aromas.", "40.0% ABV", "India", "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("3200.00"), 24)]),
            ("Rampur Double Cask Indian Single Malt", "Rampur", "whisky", "Non-chill filtered malt matured in American bourbon barrels and finished in European sherry butts.", "45.0% ABV", "India", "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("6900.00"), 8)]),
            ("Johnnie Walker Black Label 12 Yrs", "Johnnie Walker", "whisky", "Iconic blended scotch whisky with rich notes of dark fruit, sweet vanilla, and signature smokiness.", "40.0% ABV", "Scotland", "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("3950.00"), 35), ("375ml", Decimal("2100.00"), 20)]),
            ("Glenfiddich 12 Year Old Single Malt", "Glenfiddich", "whisky", "Signature single malt scotch matured in the finest Oloroso sherry and bourbon casks.", "40.0% ABV", "Scotland", "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("6400.00"), 15)]),
            ("Chivas Regal 12 Year Old", "Chivas Regal", "whisky", "Rich and fruity blend of malt and grain whiskies matured for at least 12 years.", "40.0% ABV", "Scotland", "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("3800.00"), 22)]),
            ("Royal Challenge Premium Gold", "Royal Challenge", "whisky", "Deeply blended grain whisky infused with scotch malts, a household name in Telangana.", "42.8% ABV", "India", "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("1150.00"), 50), ("375ml", Decimal("600.00"), 40), ("180ml", Decimal("310.00"), 75)]),

            # Wine
            ("Sula Dindori Reserve Shiraz", "Sula Vineyards", "wine", "Full-bodied red wine matured in American oak barrels with notes of berries and spices.", "13.5% ABV", "India", "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("1550.00"), 30)]),
            ("Fratelli Sette Red Reserve", "Fratelli Vineyards", "wine", "Ultra-premium flagship red blend from Akluj vineyards featuring Cabernet Sauvignon & Sangiovese.", "14.0% ABV", "India", "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("2200.00"), 14)]),
            ("Jacob's Creek Classic Cabernet Sauvignon", "Jacob's Creek", "wine", "Vibrant Australian red with blackcurrant and plum flavors complemented by subtle cedar oak.", "13.9% ABV", "Australia", "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("1450.00"), 25)]),
            ("Chandon Brut Sparkling Wine", "Chandon", "wine", "Fresh and elegant traditional method sparkling wine from the Nashik valley.", "12.0% ABV", "India", "https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("2400.00"), 12)]),

            # Vodka
            ("Absolut Original Vodka", "Absolut", "vodka", "Pure Swedish winter wheat vodka distilled an infinite number of times.", "40.0% ABV", "Sweden", "https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("2450.00"), 28)]),
            ("Smirnoff Red Triple Distilled Vodka", "Smirnoff", "vodka", "Clean, crisp classic vodka filtered ten times through seven columns of charcoal.", "37.5% ABV", "India", "https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("1350.00"), 45), ("375ml", Decimal("720.00"), 30)]),
            ("Grey Goose Premium French Vodka", "Grey Goose", "vodka", "Crafted from single-origin Picardie wheat and natural Gensac spring water.", "40.0% ABV", "France", "https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("5200.00"), 10)]),

            # Rum
            ("Old Monk The Legend 7 Yrs Dark Rum", "Old Monk", "rum", "Legendary Indian dark rum with distinct vanilla, dark cocoa, and caramelized molasses character.", "42.8% ABV", "India", "https://images.unsplash.com/photo-1614313511387-1436a4480ebb?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("1300.00"), 40), ("375ml", Decimal("680.00"), 30)]),
            ("Bacardi Carta Blanca Superior White Rum", "Bacardi", "rum", "Smooth white rum aged in white oak barrels and shaped through charcoal filtration.", "37.5% ABV", "India", "https://images.unsplash.com/photo-1614313511387-1436a4480ebb?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("1450.00"), 32)]),
            ("Captain Morgan Original Spiced Gold", "Captain Morgan", "rum", "Secret recipe of Caribbean rums and exotic spices with natural amber gold tones.", "35.0% ABV", "Jamaica", "https://images.unsplash.com/photo-1614313511387-1436a4480ebb?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("1650.00"), 20)]),

            # Gin
            ("Greater Than London Dry Gin", "Greater Than", "gin", "First craft gin distilled in India featuring juniper, coriander seeds, and ginger root.", "42.8% ABV", "India", "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("1850.00"), 25)]),
            ("Bombay Sapphire Distilled Gin", "Bombay Sapphire", "gin", "Vapour-infused with 10 hand-selected exotic botanicals for a bright, fresh palate.", "47.0% ABV", "United Kingdom", "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("3250.00"), 20)]),
            ("Hapusa Himalayan Dry Gin", "Hapusa", "gin", "Artisanal gin distilled with wild Himalayan juniper, turmeric, mango, and Gondhoraj limes.", "43.0% ABV", "India", "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("3400.00"), 12)]),

            # Beer
            ("Kingfisher Ultra Max Premium Beer", "Kingfisher", "beer", "Smooth super premium strong lager brewed with the finest imported pilsen malt.", "7.0% ABV", "India", "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80", [("650ml", Decimal("240.00"), 80), ("330ml", Decimal("160.00"), 60)]),
            ("Bira 91 White Wheat Ale", "Bira 91", "beer", "Naturally cloudy wheat beer with refreshing aromas of coriander seeds and orange peel.", "4.7% ABV", "India", "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80", [("330ml", Decimal("190.00"), 50), ("650ml", Decimal("290.00"), 40)]),
            ("Corona Extra Imported Beer", "Corona", "beer", "Light, crisp Mexican pale lager best enjoyed with a wedge of fresh lime.", "4.5% ABV", "Mexico", "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80", [("330ml", Decimal("290.00"), 48)]),

            # Brandy
            ("Morpheus Blue XO Premium Brandy", "Morpheus", "brandy", "Artfully blended grape brandy aged in French oak casks for rich texture and warmth.", "42.8% ABV", "India", "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("1750.00"), 20), ("375ml", Decimal("920.00"), 15)]),
            ("Hennessy VS Cognac", "Hennessy", "brandy", "World-renowned French cognac displaying bold, fragrant aromas of toasted almonds and fruit.", "40.0% ABV", "France", "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=800&q=80", [("750ml", Decimal("7800.00"), 6)]),
        ]

        for p_name, brand, cat_slug, desc, abv, origin, img_url, inventories in products_data:
            cat_id = cat_map[cat_slug]
            product = Product(
                name=p_name,
                brand=brand,
                category_id=cat_id,
                description=desc,
                alcohol_by_volume=abv,
                country_of_origin=origin,
                is_active=True,
                is_demo_data=True
            )
            db.add(product)
            db.flush()

            # Product image
            p_img = ProductImage(product_id=product.id, image_url=img_url, is_primary=True)
            db.add(p_img)

            # Assign to Retailer 1 (Madhapur)
            for size, price, stock in inventories:
                inv1 = Inventory(
                    retailer_id=retailer1.id,
                    product_id=product.id,
                    bottle_size=size,
                    price=price,
                    stock_quantity=stock,
                    is_available=True,
                    low_stock_threshold=5
                )
                db.add(inv1)

                # Retailer 2 also carries select popular brands with slight variety
                if brand in ["Amrut", "Johnnie Walker", "Sula Vineyards", "Absolut", "Greater Than", "Kingfisher", "Corona"]:
                    inv2 = Inventory(
                        retailer_id=retailer2.id,
                        product_id=product.id,
                        bottle_size=size,
                        price=price + Decimal("10.00"), # Slight variation between licensed stores
                        stock_quantity=stock // 2,
                        is_available=True,
                        low_stock_threshold=5
                    )
                    db.add(inv2)

        print("Seeding Compliance Checklist and Telangana Service Areas...")
        compliance_checklist = [
            ("TS_EXCISE_ACT_1968", "Telangana State Excise Act Compliance", "Section 15 & 34: Retail licenses A4/2B", True, "Statutory basis for licensed brick-and-mortar sales in Telangana."),
            ("DOORSTEP_DELIVERY_PERMIT", "Doorstep Alcohol Delivery Clearance", "Telangana Govt G.O. / Excise Notification", False, "Currently NOT permitted by Telangana State Government. System strictly disabled by default."),
            ("AGE_VERIFICATION_21", "21+ Statutory Age Verification", "Telangana Excise Rules", True, "Mandatory age gate for all visitors and simulated checkouts."),
            ("DRY_DAY_RESTRICTIONS", "Dry Days Calendar Compliance", "Excise Dept Annual Dry Days Schedule", True, "System accounts for statutory dry day closures and election periods."),
            ("RETAILER_A4_VALIDATION", "Excise License Verification", "Telangana State Excise Database", True, "Only verified retailers with active A4 licenses can publish inventory."),
        ]

        for code, title, ref, is_app, notes in compliance_checklist:
            comp = ComplianceApproval(
                requirement_code=code,
                title=title,
                legal_reference=ref,
                is_approved=is_app,
                approved_by_user_id=admin_user.id if is_app else None,
                approved_at=datetime.now(timezone.utc) if is_app else None,
                notes=notes
            )
            db.add(comp)

        service_zones = [
            ("Madhapur & HITEC City", "Hyderabad", "Telangana", "500081, 500082, 500084"),
            ("Jubilee Hills & Film Nagar", "Hyderabad", "Telangana", "500033, 500096"),
            ("Banjara Hills", "Hyderabad", "Telangana", "500034"),
            ("Gachibowli & Financial District", "Hyderabad", "Telangana", "500032, 500075"),
            ("Kondapur & Hafeezpet", "Hyderabad", "Telangana", "500084, 500049")
        ]

        for name, city, state, postal in service_zones:
            sa = ServiceArea(name=name, city=city, state=state, postal_codes=postal, is_active=True)
            db.add(sa)

        db.commit()
        print("Database seeded successfully with users, categories, products, licensed retailers, and compliance checks!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
