import os
import sys
from datetime import date, datetime, timezone
from decimal import Decimal

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.compliance import ComplianceApproval, ServiceArea
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Category, Inventory, Product, ProductImage
from app.models.retailer import (
    Retailer,
    RetailerLicense,
    RetailerStatus,
)
from app.models.user import Address, CustomerProfile, DeliveryPartnerProfile, User, UserRole


def seed_database(target_engine=None, target_session=None):
    print("Initializing tables...")
    eng = target_engine or engine
    Base.metadata.create_all(bind=eng)
    db = target_session() if target_session else SessionLocal()

    try:
        # Check if already seeded
        existing_admin = db.query(User).filter(User.email == "admin@telanganaliquor.gov.mock").first()
        if existing_admin:
            # Ensure delivery partner is seeded even if initial seed was done previously
            existing_partner = db.query(User).filter(User.email == "partner@demo.com").first()
            if not existing_partner:
                print("Seeding missing Delivery Partner user & profile...")
                partner_user = User(
                    email="partner@demo.com",
                    hashed_password=hash_password("Partner@123456"),
                    full_name="Suresh Kumar Goud",
                    phone="+91-9876501234",
                    role=UserRole.DELIVERY_PARTNER,
                    is_active=True,
                    is_verified=True
                )
                db.add(partner_user)
                db.flush()

                partner_profile = DeliveryPartnerProfile(
                    user_id=partner_user.id,
                    vehicle_type="Honda Activa 6G (Petrol/EV)",
                    vehicle_number="TS 09 EB 4821",
                    driving_license_number="DL-TS-2022-987654",
                    is_online=True,
                    current_zone="Madhapur & HITEC City",
                    rating=Decimal("4.92"),
                    total_trips=42,
                    today_trips=6,
                    today_earnings=Decimal("620.00"),
                    total_earnings=Decimal("18450.00"),
                    is_verified=True,
                    compliance_permit_no="TS-EXCISE-DP-2024-0982"
                )
                db.add(partner_profile)
                db.commit()
                print("Delivery partner seeded successfully into existing database.")
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

        # 5. Delivery Partner: Suresh Kumar Goud (Verified)
        partner_user = User(
            email="partner@demo.com",
            hashed_password=hash_password("Partner@123456"),
            full_name="Suresh Kumar Goud",
            phone="+91-9876501234",
            role=UserRole.DELIVERY_PARTNER,
            is_active=True,
            is_verified=True
        )
        db.add(partner_user)
        db.flush()

        partner_profile = DeliveryPartnerProfile(
            user_id=partner_user.id,
            vehicle_type="Honda Activa 6G (Petrol/EV)",
            vehicle_number="TS 09 EB 4821",
            driving_license_number="DL-TS-2022-987654",
            is_online=True,
            current_zone="Madhapur & HITEC City",
            rating=Decimal("4.92"),
            total_trips=42,
            today_trips=6,
            today_earnings=Decimal("620.00"),
            total_earnings=Decimal("18450.00"),
            is_verified=True,
            compliance_permit_no="TS-EXCISE-DP-2024-0982"
        )
        db.add(partner_profile)

        print("Seeding Categories...")
        categories_data = [
            ("Whisky & Single Malts", "whisky", "Finest Indian single malts, scotch, and blended whiskies", "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80"),
            ("Wine & Sparkling", "wine", "Red, white, rose, and sparkling wines from premium vineyards", "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80"),
            ("Vodka", "vodka", "Triple distilled, grain, and botanical vodkas", "https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=600&q=80"),
            ("Rum", "rum", "Dark, spiced, and golden aged rums", "https://images.unsplash.com/photo-1614313511387-1436a4480ebb?auto=format&fit=crop&w=600&q=80"),
            ("Gin & Botanicals", "gin", "Craft craft gins infused with Indian botanicals and juniper", "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80"),
            ("Beer & Cider", "beer", "Lagers, ales, wheat beers, and stouts", "https://images.unsplash.com/photo-1608270119278-65636055d7b5?auto=format&fit=crop&w=600&q=80"),
            ("Brandy & Cognac", "brandy", "Aged French cognacs and popular Indian brandies", "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=600&q=80"),
            ("Tequila & Agave", "tequila", "Blanco, Reposado, and Anejo tequilas crafted from blue agave", "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80"),
            ("Liqueurs & Digestifs", "liqueur", "Herb-infused spirits, dairy cream liqueurs, and bitters", "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=600&q=80"),
        ]

        cat_map = {}
        for name, slug, desc, img in categories_data:
            cat = Category(name=name, slug=slug, description=desc, image_url=img, is_active=True)
            db.add(cat)
            db.flush()
            cat_map[slug] = cat.id

        print("Seeding Products and Retailer Inventories...")
        products_data = [
            ("Bira 91 Blonde Lager", "Bira 91", "beer", "Bira 91 Blonde Lager (Lager). Genuine Telangana excise-compliant beverage.", "4.9% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Bira_91_White_beer_bottle.jpg?width=600", [("330ml", Decimal("80.00"), 20), ("500ml", Decimal("120.00"), 27), ("650ml", Decimal("150.00"), 34)]),
            ("Bira 91 White Beer", "Bira 91", "beer", "Bira 91 White Beer (Wheat Beer). Genuine Telangana excise-compliant beverage.", "4.9% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Bira_91_White_beer_bottle.jpg?width=600", [("330ml", Decimal("80.00"), 79), ("500ml", Decimal("120.00"), 6), ("650ml", Decimal("150.00"), 13)]),
            ("Budweiser Magnum Strong Beer", "Budweiser", "beer", "Budweiser Magnum Strong Beer (Strong Lager). Genuine Telangana excise-compliant beverage.", "5.0% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Budweiser_Bottle.jpg?width=600", [("330ml", Decimal("80.00"), 37), ("500ml", Decimal("120.00"), 44), ("650ml", Decimal("150.00"), 51)]),
            ("Budweiser Premium Lager Beer", "Budweiser", "beer", "Budweiser Premium Lager Beer (Lager). Genuine Telangana excise-compliant beverage.", "5.0% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Budweiser_Bottle.jpg?width=600", [("330ml", Decimal("80.00"), 16), ("500ml", Decimal("120.00"), 23), ("650ml", Decimal("150.00"), 30)]),
            ("Carlsberg Elephant Strong Beer", "Carlsberg", "beer", "Carlsberg Elephant Strong Beer (Strong Lager). Genuine Telangana excise-compliant beverage.", "5.0% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Cervexa_Carlsberb_botella_e_vaso.JPG?width=600", [("330ml", Decimal("80.00"), 75), ("500ml", Decimal("120.00"), 82), ("650ml", Decimal("150.00"), 9)]),
            ("Godfather Super Strong Beer", "Godfather", "beer", "Godfather Super Strong Beer (Strong Lager). Genuine Telangana excise-compliant beverage.", "7.5% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Kingfisher_beer_bottle.jpg?width=600", [("330ml", Decimal("80.00"), 62), ("500ml", Decimal("120.00"), 69), ("650ml", Decimal("150.00"), 76)]),
            ("Haywards 5000 Strong Beer", "Haywards 5000", "beer", "Haywards 5000 Strong Beer (Strong Lager). Genuine Telangana excise-compliant beverage.", "7.2% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Kingfisher_beer_bottle.jpg?width=600", [("330ml", Decimal("80.00"), 41), ("500ml", Decimal("120.00"), 48), ("650ml", Decimal("150.00"), 55)]),
            ("Heineken Lager Beer", "Heineken", "beer", "Heineken Lager Beer (Lager). Genuine Telangana excise-compliant beverage.", "5.0% ABV", "Netherlands", "https://commons.wikimedia.org/wiki/Special:FilePath/Heineken_Bottle.jpg?width=600", [("330ml", Decimal("80.00"), 58), ("500ml", Decimal("120.00"), 65), ("650ml", Decimal("150.00"), 72)]),
            ("Kingfisher Premium Lager Beer", "Kingfisher", "beer", "Kingfisher Premium Lager Beer (Lager). Genuine Telangana excise-compliant beverage.", "5.0% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Kingfisher_beer_bottle.jpg?width=600", [("330ml", Decimal("80.00"), 71), ("500ml", Decimal("120.00"), 78), ("650ml", Decimal("150.00"), 5)]),
            ("Kingfisher Strong Beer", "Kingfisher", "beer", "Kingfisher Strong Beer (Strong Lager). Genuine Telangana excise-compliant beverage.", "5.0% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Kingfisher_beer_bottle.jpg?width=600", [("330ml", Decimal("80.00"), 12), ("500ml", Decimal("120.00"), 19), ("650ml", Decimal("150.00"), 26)]),
            ("Tuborg Green Lager Beer", "Tuborg", "beer", "Tuborg Green Lager Beer (Lager). Genuine Telangana excise-compliant beverage.", "4.8% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Tuborg_bottle.jpg?width=600", [("330ml", Decimal("80.00"), 33), ("500ml", Decimal("120.00"), 40), ("650ml", Decimal("150.00"), 47)]),
            ("Tuborg Strong Beer", "Tuborg", "beer", "Tuborg Strong Beer (Strong Lager). Genuine Telangana excise-compliant beverage.", "4.8% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Tuborg_bottle.jpg?width=600", [("330ml", Decimal("80.00"), 54), ("500ml", Decimal("120.00"), 61), ("650ml", Decimal("150.00"), 68)]),
            ("Courrier Napoleon Brandy", "Courrier Napoleon", "brandy", "Courrier Napoleon Brandy (Brandy). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/mansion_house.jpg", [("180ml", Decimal("170.00"), 84), ("375ml", Decimal("350.00"), 11), ("750ml", Decimal("700.00"), 18)]),
            ("Honey Bee Brandy", "Honey Bee", "brandy", "Honey Bee Brandy (Brandy). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/mansion_house.jpg", [("180ml", Decimal("170.00"), 42), ("375ml", Decimal("350.00"), 49), ("750ml", Decimal("700.00"), 56)]),
            ("Mansion House French Brandy", "Mansion House", "brandy", "Mansion House French Brandy (Brandy). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/mansion_house.jpg", [("180ml", Decimal("170.00"), 21), ("375ml", Decimal("350.00"), 28), ("750ml", Decimal("700.00"), 35)]),
            ("Morpheus XO Blended Brandy", "Morpheus", "brandy", "Morpheus XO Blended Brandy (Brandy). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/morpheus_xo.jpg", [("180ml", Decimal("170.00"), 63), ("375ml", Decimal("350.00"), 70), ("750ml", Decimal("700.00"), 77)]),
            ("Old Admiral Brandy", "Old Admiral", "brandy", "Old Admiral Brandy (Brandy). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/mansion_house.jpg", [("180ml", Decimal("170.00"), 25), ("375ml", Decimal("350.00"), 32), ("750ml", Decimal("700.00"), 39)]),
            ("Blue Riband Gin", "Blue Riband", "gin", "Blue Riband Gin (Dry Gin). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/greater_than.jpg", [("180ml", Decimal("260.00"), 46), ("375ml", Decimal("550.00"), 53), ("750ml", Decimal("1100.00"), 60)]),
            ("Bombay Sapphire London Dry Gin", "Bombay Sapphire", "gin", "Bombay Sapphire London Dry Gin (London Dry Gin). Genuine Telangana excise-compliant beverage.", "47.0% ABV", "United Kingdom", "https://commons.wikimedia.org/wiki/Special:FilePath/Bombay_sapphire_bottle.jpg?width=600", [("180ml", Decimal("260.00"), 8), ("375ml", Decimal("550.00"), 15), ("750ml", Decimal("1100.00"), 22)]),
            ("Greater Than London Dry Gin", "Greater Than", "gin", "Greater Than London Dry Gin (London Dry Gin). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/greater_than.jpg", [("180ml", Decimal("260.00"), 67), ("375ml", Decimal("550.00"), 74), ("750ml", Decimal("1100.00"), 81)]),
            ("Pumori Small Batch Gin", "Pumori", "gin", "Pumori Small Batch Gin (Craft Gin). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/greater_than.jpg", [("180ml", Decimal("260.00"), 50), ("375ml", Decimal("550.00"), 57), ("750ml", Decimal("1100.00"), 64)]),
            ("Tanqueray London Dry Gin", "Tanqueray", "gin", "Tanqueray London Dry Gin (London Dry Gin). Genuine Telangana excise-compliant beverage.", "43.1% ABV", "United Kingdom", "https://commons.wikimedia.org/wiki/Special:FilePath/Tanqueray_bottle.JPG?width=600", [("180ml", Decimal("260.00"), 29), ("375ml", Decimal("550.00"), 36), ("750ml", Decimal("1100.00"), 43)]),
            ("Baileys Original Irish Cream", "Baileys", "liqueur", "Baileys Original Irish Cream (Cream Liqueur). Genuine Telangana excise-compliant beverage.", "17.0% ABV", "Ireland", "https://commons.wikimedia.org/wiki/Special:FilePath/Baileys.JPG?width=600", [("750ml", Decimal("2400.00"), 21)]),
            ("Jägermeister Herbal Liqueur", "Jägermeister", "liqueur", "Jägermeister Herbal Liqueur (Herbal Liqueur). Genuine Telangana excise-compliant beverage.", "35.0% ABV", "Germany", "https://commons.wikimedia.org/wiki/Special:FilePath/Jagermeister_bottle.jpg?width=600", [("750ml", Decimal("2400.00"), 28)]),
            ("Bacardi Carta Blanca White Rum", "Bacardi", "rum", "Bacardi Carta Blanca White Rum (White Rum). Genuine Telangana excise-compliant beverage.", "37.5% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Bacardi_Superior.jpg?width=600", [("180ml", Decimal("160.00"), 13), ("375ml", Decimal("320.00"), 20), ("750ml", Decimal("650.00"), 27)]),
            ("Captain Morgan Original Spiced Rum", "Captain Morgan", "rum", "Captain Morgan Original Spiced Rum (Spiced Rum). Genuine Telangana excise-compliant beverage.", "35.0% ABV", "Jamaica", "https://commons.wikimedia.org/wiki/Special:FilePath/Captain_Morgan_Bottle.jpg?width=600", [("180ml", Decimal("160.00"), 34), ("375ml", Decimal("320.00"), 41), ("750ml", Decimal("650.00"), 48)]),
            ("Contessa XXX Rum", "Contessa", "rum", "Contessa XXX Rum (Dark Rum). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Old_Monk_Rum.jpg?width=600", [("180ml", Decimal("160.00"), 55), ("375ml", Decimal("320.00"), 62), ("750ml", Decimal("650.00"), 69)]),
            ("McDowell's Celebration XXX Rum", "McDowell's Celebration", "rum", "McDowell's Celebration XXX Rum (Dark Rum). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/McDowoll's_no1_celebration_Rum.JPG?width=600", [("180ml", Decimal("160.00"), 72), ("375ml", Decimal("320.00"), 79), ("750ml", Decimal("650.00"), 6)]),
            ("Old Monk XXX Rum", "Old Monk", "rum", "Old Monk XXX Rum (Dark Rum). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Old_Monk_Rum.jpg?width=600", [("180ml", Decimal("160.00"), 51), ("375ml", Decimal("320.00"), 58), ("750ml", Decimal("650.00"), 65)]),
            ("Jose Cuervo Especial Gold Tequila", "Jose Cuervo", "tequila", "Jose Cuervo Especial Gold Tequila (Gold Tequila). Genuine Telangana excise-compliant beverage.", "38.0% ABV", "Mexico", "https://commons.wikimedia.org/wiki/Special:FilePath/Jose_cuervo.jpg?width=600", [("750ml", Decimal("2200.00"), 7)]),
            ("Jose Cuervo Especial Silver Tequila", "Jose Cuervo", "tequila", "Jose Cuervo Especial Silver Tequila (Silver Tequila). Genuine Telangana excise-compliant beverage.", "38.0% ABV", "Mexico", "https://commons.wikimedia.org/wiki/Special:FilePath/Jose_cuervo.jpg?width=600", [("750ml", Decimal("2200.00"), 14)]),
            ("Absolut Original Vodka", "Absolut", "vodka", "Absolut Original Vodka (Swedish Vodka). Genuine Telangana excise-compliant beverage.", "40.0% ABV", "Sweden", "https://commons.wikimedia.org/wiki/Special:FilePath/A_bottle_of_Absolut_Vodka.jpg?width=600", [("180ml", Decimal("180.00"), 59), ("375ml", Decimal("380.00"), 66), ("750ml", Decimal("750.00"), 73)]),
            ("Belvedere Pure Vodka", "Belvedere", "vodka", "Belvedere Pure Vodka (Polish Vodka). Genuine Telangana excise-compliant beverage.", "40.0% ABV", "Poland", "https://commons.wikimedia.org/wiki/Special:FilePath/Belvedere_Vodka_01.jpg?width=600", [("180ml", Decimal("180.00"), 80), ("375ml", Decimal("380.00"), 7), ("750ml", Decimal("750.00"), 14)]),
            ("Magic Moments Pure Grain Vodka", "Magic Moments", "vodka", "Magic Moments Pure Grain Vodka (Vodka). Genuine Telangana excise-compliant beverage.", "37.5% ABV", "India", "/images/products/magic_moments.jpg", [("180ml", Decimal("180.00"), 76), ("375ml", Decimal("380.00"), 83), ("750ml", Decimal("750.00"), 10)]),
            ("Romanov Premium Vodka", "Romanov", "vodka", "Romanov Premium Vodka (Vodka). Genuine Telangana excise-compliant beverage.", "37.5% ABV", "India", "/images/products/magic_moments.jpg", [("180ml", Decimal("180.00"), 38), ("375ml", Decimal("380.00"), 45), ("750ml", Decimal("750.00"), 52)]),
            ("Smirnoff Triple Distilled Vodka", "Smirnoff", "vodka", "Smirnoff Triple Distilled Vodka (Vodka). Genuine Telangana excise-compliant beverage.", "37.5% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Smirnoff_Vodka_bottle_front.jpg?width=600", [("180ml", Decimal("180.00"), 17), ("375ml", Decimal("380.00"), 24), ("750ml", Decimal("750.00"), 31)]),
            ("100 Pipers Deluxe Blended Scotch Whisky", "100 Pipers", "whisky", "100 Pipers Deluxe Blended Scotch Whisky (Blended Scotch Whisky). Genuine Telangana excise-compliant beverage.", "40.0% ABV", "Scotland", "https://commons.wikimedia.org/wiki/Special:FilePath/100_Pipers_bottle.jpg?width=600", [("180ml", Decimal("200.00"), 81), ("375ml", Decimal("420.00"), 8), ("750ml", Decimal("850.00"), 15)]),
            ("8 PM Premium Black Whisky", "8 PM", "whisky", "8 PM Premium Black Whisky (Blended Indian Whisky). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/8pm.jpg", [("180ml", Decimal("200.00"), 56), ("375ml", Decimal("420.00"), 63), ("750ml", Decimal("850.00"), 70)]),
            ("Amrut Indian Single Malt Whisky", "Amrut", "whisky", "Amrut Indian Single Malt Whisky (Indian Single Malt). Genuine Telangana excise-compliant beverage.", "46.0% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Amrut_singlemalt_whisky_2013-06-11_18-39.jpg?width=600", [("180ml", Decimal("200.00"), 47), ("375ml", Decimal("420.00"), 54), ("750ml", Decimal("850.00"), 61)]),
            ("Antiquity Blue Ultra Premium Whisky", "Antiquity", "whisky", "Antiquity Blue Ultra Premium Whisky (Blended Indian Whisky). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/antiquity_blue.jpg", [("180ml", Decimal("200.00"), 39), ("375ml", Decimal("420.00"), 46), ("750ml", Decimal("850.00"), 53)]),
            ("Black Dog Triple Gold Reserve Whisky", "Black Dog", "whisky", "Black Dog Triple Gold Reserve Whisky (Blended Scotch Whisky). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "Scotland", "https://commons.wikimedia.org/wiki/Special:FilePath/Liquor_-_Black_Dog_Whiskey.jpg?width=600", [("180ml", Decimal("200.00"), 22), ("375ml", Decimal("420.00"), 29), ("750ml", Decimal("850.00"), 36)]),
            ("Blenders Pride Rare Premium Whisky", "Blenders Pride", "whisky", "Blenders Pride Rare Premium Whisky (Premium Blended Whisky). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/blenders_pride.jpg", [("180ml", Decimal("200.00"), 73), ("375ml", Decimal("420.00"), 80), ("750ml", Decimal("850.00"), 7)]),
            ("Chivas Regal 12 Year Old Whisky", "Chivas Regal", "whisky", "Chivas Regal 12 Year Old Whisky (Blended Scotch Whisky). Genuine Telangana excise-compliant beverage.", "40.0% ABV", "Scotland", "https://commons.wikimedia.org/wiki/Special:FilePath/Chivas_Regal_The_Icon_Blended_Scotch_Whisky_(700mL).jpg?width=600", [("180ml", Decimal("200.00"), 64), ("375ml", Decimal("420.00"), 71), ("750ml", Decimal("850.00"), 78)]),
            ("Glenfiddich 12 Year Old Single Malt", "Glenfiddich", "whisky", "Glenfiddich 12 Year Old Single Malt (Single Malt Scotch Whisky). Genuine Telangana excise-compliant beverage.", "40.0% ABV", "Scotland", "https://commons.wikimedia.org/wiki/Special:FilePath/Glenfiddich_19_years_whiskey_in_a_duty_free_at_Amsterdam_Schiphol_Airport_.jpg?width=600", [("180ml", Decimal("200.00"), 26), ("375ml", Decimal("420.00"), 33), ("750ml", Decimal("850.00"), 40)]),
            ("ICONiQ White Whisky", "ICONiQ White", "whisky", "ICONiQ White Whisky (Blended Indian Whisky). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/royal_stag.jpg", [("180ml", Decimal("200.00"), 9), ("375ml", Decimal("420.00"), 16), ("750ml", Decimal("850.00"), 23)]),
            ("Imperial Blue Superior Grain Whisky", "Imperial Blue", "whisky", "Imperial Blue Superior Grain Whisky (Blended Indian Whisky). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/imperial_blue.jpg", [("180ml", Decimal("200.00"), 14), ("375ml", Decimal("420.00"), 21), ("750ml", Decimal("850.00"), 28)]),
            ("Indri-Trini Indian Single Malt Whisky", "Indri", "whisky", "Indri-Trini Indian Single Malt Whisky (Indian Single Malt). Genuine Telangana excise-compliant beverage.", "46.0% ABV", "India", "/images/products/indri.jpg", [("180ml", Decimal("200.00"), 68), ("375ml", Decimal("420.00"), 75), ("750ml", Decimal("850.00"), 82)]),
            ("Jameson Irish Whiskey", "Jameson", "whisky", "Jameson Irish Whiskey (Irish Whiskey). Genuine Telangana excise-compliant beverage.", "40.0% ABV", "Ireland", "https://commons.wikimedia.org/wiki/Special:FilePath/Jameson_Irish_Whiskey_(11898467796).jpg?width=600", [("180ml", Decimal("200.00"), 5), ("375ml", Decimal("420.00"), 12), ("750ml", Decimal("850.00"), 19)]),
            ("Johnnie Walker Red Label Whisky", "Johnnie Walker", "whisky", "Johnnie Walker Red Label Whisky (Blended Scotch Whisky). Genuine Telangana excise-compliant beverage.", "40.0% ABV", "Scotland", "https://commons.wikimedia.org/wiki/Special:FilePath/Johnnie_Walker_Red_Label.jpg?width=600", [("180ml", Decimal("200.00"), 43), ("375ml", Decimal("420.00"), 50), ("750ml", Decimal("850.00"), 57)]),
            ("McDowell's No.1 Luxury Whisky", "McDowell's No.1", "whisky", "McDowell's No.1 Luxury Whisky (Blended Indian Whisky). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/McDowell's_No.1,_Indian_whisky.jpg?width=600", [("180ml", Decimal("200.00"), 35), ("375ml", Decimal("420.00"), 42), ("750ml", Decimal("850.00"), 49)]),
            ("Officer's Choice Blue Whisky", "Officer's Choice", "whisky", "Officer's Choice Blue Whisky (Blended Indian Whisky). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/officers_choice_blue.jpg", [("180ml", Decimal("200.00"), 77), ("375ml", Decimal("420.00"), 84), ("750ml", Decimal("850.00"), 11)]),
            ("Royal Challenge American Pride Whisky", "Royal Challenge", "whisky", "Royal Challenge American Pride Whisky (Blended Indian Whisky). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/royal_challenge.jpg", [("180ml", Decimal("200.00"), 60), ("375ml", Decimal("420.00"), 67), ("750ml", Decimal("850.00"), 74)]),
            ("Royal Stag Deluxe Whisky", "Royal Stag", "whisky", "Royal Stag Deluxe Whisky (Blended Indian Whisky). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/royal_stag.jpg", [("180ml", Decimal("200.00"), 52), ("375ml", Decimal("420.00"), 59), ("750ml", Decimal("850.00"), 66)]),
            ("Signature Premier Grain Whisky", "Signature", "whisky", "Signature Premier Grain Whisky (Blended Indian Whisky). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/signature.jpg", [("180ml", Decimal("200.00"), 18), ("375ml", Decimal("420.00"), 25), ("750ml", Decimal("850.00"), 32)]),
            ("Woodburns Contemporary Indian Whisky", "Woodburns", "whisky", "Woodburns Contemporary Indian Whisky (Indian Whisky). Genuine Telangana excise-compliant beverage.", "42.8% ABV", "India", "/images/products/signature.jpg", [("180ml", Decimal("200.00"), 30), ("375ml", Decimal("420.00"), 37), ("750ml", Decimal("850.00"), 44)]),
            ("Fratelli Sette Red Wine", "Fratelli", "wine", "Fratelli Sette Red Wine (Red Wine). Genuine Telangana excise-compliant beverage.", "14.0% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Fratelli_Wines.jpg?width=600", [("375ml", Decimal("480.00"), 31), ("750ml", Decimal("950.00"), 38)]),
            ("Grover Zampa La Reserve Red Wine", "Grover Zampa", "wine", "Grover Zampa La Reserve Red Wine (Red Wine). Genuine Telangana excise-compliant beverage.", "13.5% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Fratelli_Wines.jpg?width=600", [("375ml", Decimal("480.00"), 45), ("750ml", Decimal("950.00"), 52)]),
            ("Jacob's Creek Shiraz Cabernet Red Wine", "Jacob's Creek", "wine", "Jacob's Creek Shiraz Cabernet Red Wine (Red Wine). Genuine Telangana excise-compliant beverage.", "13.5% ABV", "Australia", "https://commons.wikimedia.org/wiki/Special:FilePath/Chardonnay_Pinot_Noir.jpg?width=600", [("375ml", Decimal("480.00"), 73), ("750ml", Decimal("950.00"), 80)]),
            ("Sula Rasa Shiraz Red Wine", "Sula", "wine", "Sula Rasa Shiraz Red Wine (Red Wine). Genuine Telangana excise-compliant beverage.", "13.5% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/RASA_Cabernet_Sauvignon.jpg?width=600", [("375ml", Decimal("480.00"), 83), ("750ml", Decimal("950.00"), 10)]),
            ("Sula Sauvignon Blanc White Wine", "Sula", "wine", "Sula Sauvignon Blanc White Wine (White Wine). Genuine Telangana excise-compliant beverage.", "13.5% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/RASA_Cabernet_Sauvignon.jpg?width=600", [("375ml", Decimal("480.00"), 17), ("750ml", Decimal("950.00"), 24)]),
            ("York Arros Red Wine", "York", "wine", "York Arros Red Wine (Red Wine). Genuine Telangana excise-compliant beverage.", "13.5% ABV", "India", "https://commons.wikimedia.org/wiki/Special:FilePath/Fratelli_Wines.jpg?width=600", [("375ml", Decimal("480.00"), 59), ("750ml", Decimal("950.00"), 66)]),
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
                r2_popular = {
                    "Royal Stag", "Blenders Pride", "Amrut", "Indri", "Johnnie Walker", "Chivas Regal",
                    "Sula", "Fratelli", "Absolut", "Smirnoff", "Old Monk", "Bacardi", "Greater Than",
                    "Bombay Sapphire", "Kingfisher", "Bira 91", "Budweiser", "Morpheus", "Jose Cuervo",
                    "Baileys", "Jägermeister"
                }
                if brand in r2_popular:
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

        print("Seeding Initial Demonstration Orders for Delivery Partner...")
        sample_order1 = Order(
            order_number="TS-ORD-2026-9041",
            user_id=customer_user.id,
            retailer_id=retailer1.id,
            status=OrderStatus.READY,
            subtotal=Decimal("850.00"),
            delivery_fee=Decimal("0.00"),
            taxes=Decimal("0.00"),
            total_amount=Decimal("850.00"),
            address_snapshot="Flat 402, Royal Palms Apartments, Near Durgam Cheruvu, Madhapur, Hyderabad, Telangana - 500081",
            is_simulated=True,
            notes="Please call upon arrival at building gate.",
            delivery_otp="4821"
        )
        db.add(sample_order1)
        db.flush()

        sample_item1 = OrderItem(
            order_id=sample_order1.id,
            product_name="Royal Stag Deluxe Whisky",
            brand="Royal Stag",
            bottle_size="750ml",
            unit_price=Decimal("850.00"),
            quantity=1,
            total_price=Decimal("850.00")
        )
        db.add(sample_item1)

        sample_order2 = Order(
            order_number="TS-ORD-2026-9042",
            user_id=customer_user.id,
            retailer_id=retailer2.id,
            status=OrderStatus.READY,
            subtotal=Decimal("150.00"),
            delivery_fee=Decimal("0.00"),
            taxes=Decimal("0.00"),
            total_amount=Decimal("150.00"),
            address_snapshot="Level 8, Cyber Towers, HITEC City Main Road, Hyderabad, Telangana - 500081",
            is_simulated=True,
            notes="Handover at reception tower A.",
            delivery_otp="6912"
        )
        db.add(sample_order2)
        db.flush()

        sample_item2 = OrderItem(
            order_id=sample_order2.id,
            product_name="Bira 91 White Beer",
            brand="Bira 91",
            bottle_size="650ml",
            unit_price=Decimal("150.00"),
            quantity=1,
            total_price=Decimal("150.00")
        )
        db.add(sample_item2)

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
