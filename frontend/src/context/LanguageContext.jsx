import React, { createContext, useContext, useState, useEffect } from 'react';

// Product name mappings (English to Telugu)
const PRODUCT_TRANSLATIONS = {
  'Amrut Fusion Single Malt': 'అమృత్ ఫ్యూజన్ సింగిల్ మాల్ట్',
  'Paul John Nirvana Single Malt': 'పాల్ జాన్ నిర్వాణ సింగిల్ మాల్ట్',
  'Rampur Double Cask Indian Single Malt': 'రాంపూర్ డబుల్ కాస్క్ ఇండియన్ సింగిల్ మాల్ట్',
  'Johnnie Walker Black Label 12 Yrs': 'జానీ వాకర్ బ్లాక్ లేబుల్ 12 ఇయర్స్',
  'Glenfiddich 12 Year Old Single Malt': 'గ్లెన్‌ఫిడిచ్ 12 ఇయర్ ఓల్డ్ సింగిల్ మాల్ట్',
  'Chivas Regal 12 Year Old': 'షివాస్ రీగల్ 12 ఇయర్ ఓల్డ్',
  'Royal Challenge Premium Gold': 'రాయల్ ఛాలెంజ్ ప్రీమియం గోల్డ్',
  'Sula Dindori Reserve Shiraz': 'సులా దిండోరి రిజర్వ్ షిరాజ్',
  'Fratelli Sette Red Reserve': 'ఫ్రాతెల్లి సెట్టె రెడ్ రిజర్వ్',
  "Jacob's Creek Classic Cabernet Sauvignon": 'జాకబ్స్ క్రీక్ క్లాసిక్ కాబెర్నెట్ సావిగ్నాన్',
  'Chandon Brut Sparkling Wine': 'చాండన్ బ్రూట్ స్పార్క్లింగ్ వైన్',
  'Absolut Original Vodka': 'అబ్సల్యూట్ ఒరిజినల్ వోడ్కా',
  'Smirnoff Red Triple Distilled Vodka': 'స్మిర్నాఫ్ రెడ్ ట్రిపుల్ డిస్టిల్డ్ వోడ్కా',
  'Grey Goose Premium French Vodka': 'గ్రే గూస్ ప్రీమియం ఫ్రెంచ్ వోడ్కా',
  'Old Monk The Legend 7 Yrs Dark Rum': 'ఓల్డ్ మాంక్ ది లెజెండ్ 7 ఇయర్స్ డార్క్ రమ్',
  'Bacardi Carta Blanca Superior White Rum': 'బకార్డీ కార్టా బ్లాంకా వైట్ రమ్',
  'Captain Morgan Original Spiced Gold': 'కెప్టెన్ మోర్గాన్ ఒరిజినల్ స్పైస్డ్ గోల్డ్',
  'Greater Than London Dry Gin': 'గ్రేటర్ దాన్ లండన్ డ్రై జిన్',
  'Bombay Sapphire Distilled Gin': 'బాంబే సఫైర్ డిస్టిల్డ్ జిన్',
  'Hapusa Himalayan Dry Gin': 'హపుసా హిమాలయన్ డ్రై జిన్',
  'Kingfisher Ultra Max Premium Beer': 'కింగ్‌ఫిషర్ అల్ట్రా మ్యాక్స్ ప్రీమియం బీర్',
  'Bira 91 White Wheat Ale': 'బీరా 91 వైట్ వీట్ ఏల్',
  'Corona Extra Imported Beer': 'కరోనా ఎక్స్‌ట్రా ఇంపోర్టెడ్ బీర్',
  'Morpheus Blue XO Premium Brandy': 'మార్ఫియస్ బ్లూ XO ప్రీమియం బ్రాందీ',
  'Hennessy VS Cognac': 'హెన్నెస్సీ VS కాగ్నాక్'
};

// Brand name mappings
const BRAND_TRANSLATIONS = {
  'Amrut': 'అమృత్',
  'Paul John': 'పాల్ జాన్',
  'Rampur': 'రాంపూర్',
  'Johnnie Walker': 'జానీ వాకర్',
  'Glenfiddich': 'గ్లెన్‌ఫిడిచ్',
  'Chivas Regal': 'షివాస్ రీగల్',
  'Royal Challenge': 'రాయల్ ఛాలెంజ్',
  'Sula Vineyards': 'సులా వైన్‌యార్డ్స్',
  'Fratelli Vineyards': 'ఫ్రాతెల్లి వైన్‌యార్డ్స్',
  "Jacob's Creek": 'జాకబ్స్ క్రీక్',
  'Chandon': 'చాండన్',
  'Absolut': 'అబ్సల్యూట్',
  'Smirnoff': 'స్మిర్నాఫ్',
  'Grey Goose': 'గ్రే గూస్',
  'Old Monk': 'ఓల్డ్ మాంక్',
  'Bacardi': 'బకార్డీ',
  'Captain Morgan': 'కెప్టెన్ మోర్గాన్',
  'Greater Than': 'గ్రేటర్ దాన్',
  'Bombay Sapphire': 'బాంబే సఫైర్',
  'Hapusa': 'హపుసా',
  'Kingfisher': 'కింగ్‌ఫిషర్',
  'Bira 91': 'బీరా 91',
  'Corona': 'కరోనా',
  'Morpheus': 'మార్ఫియస్',
  'Hennessy': 'హెన్నెస్సీ'
};

// Category name mappings
const CATEGORY_TRANSLATIONS = {
  'Whisky & Single Malts': 'విస్కీ & సింగిల్ మాల్ట్స్',
  'Wine & Sparkling': 'వైన్ & స్పార్క్లింగ్',
  'Vodka': 'వోడ్కా',
  'Rum': 'రమ్',
  'Gin & Botanicals': 'జిన్ & బొటానికల్స్',
  'Beer & Cider': 'బీర్ & సైడర్',
  'Brandy & Cognac': 'బ్రాందీ & కాగ్నాక్',
  'Spirits': 'స్పిరిట్స్',
  'Whisky': 'విస్కీ',
  'Wine': 'వైన్',
  'Beer': 'బీర్',
  'Gin': 'జిన్',
  'Brandy': 'బ్రాందీ',
  'Tequila & Agave': 'టెకీలా & అగవే',
  'Liqueurs & Digestifs': 'లిక్కర్స్ & డైజెస్టిఫ్స్',
  'Tequila': 'టెకీలా',
  'Liqueur': 'లిక్కర్'
};

// Shop and retailer name mappings
const RETAILER_TRANSLATIONS = {
  'Madhapur Premium Wines & Spirits': 'మాదాపూర్ ప్రీమియం వైన్స్ & స్పిరిట్స్',
  'Sri Balaji Wines A4 Retail': 'శ్రీ బాలాజీ వైన్స్ A4 రిటైల్',
  'Jubilee Hills Cellars & Malts': 'జూబ్లీ హిల్స్ సెల్లార్స్ & మాల్ట్స్',
  'Gachibowli Beverage Boutique': 'గచ్చిబౌలి బెవరేజ్ బోటిక్',
  'Madhapur Wines': 'మాదాపూర్ వైన్స్',
  'Jubilee Heritage Beverage Outlet': 'జూబ్లీ హెరిటేజ్ బెవరేజ్ అవుట్‌లెట్',
  'Srinivas Wines Gachibowli': 'శ్రీనివాస్ వైన్స్ గచ్చిబౌలి'
};

// Country of Origin mappings
const COUNTRY_TRANSLATIONS = {
  'India': 'భారతదేశం',
  'Scotland': 'స్కాట్లాండ్',
  'France': 'ఫ్రాన్స్',
  'Sweden': 'స్వీడన్',
  'Mexico': 'మెక్సికో',
  'Australia': 'ఆస్ట్రేలియా',
  'Jamaica': 'జమైకా',
  'United Kingdom': 'యునైటెడ్ కింగ్‌డమ్',
  'Ireland': 'ఐర్లాండ్',
  'Germany': 'జర్మనీ',
  'Poland': 'పోలాండ్',
  'Netherlands': 'నెదర్లాండ్స్'
};

// Bottle Size mappings
const SIZE_TRANSLATIONS = {
  '750ml': '750 మి.లీ',
  '375ml': '375 మి.లీ',
  '180ml': '180 మి.లీ',
  '650ml': '650 మి.లీ',
  '500ml': '500 మి.లీ',
  '330ml': '330 మి.లీ'
};

// Common word transliterations for dynamic fallback
const COMMON_WORDS_MAP = {
  'Single Malt': 'సింగిల్ మాల్ట్',
  'Whisky': 'విస్కీ',
  'Whiskey': 'విస్కీ',
  'Scotch': 'స్కాచ్',
  'Vodka': 'వోడ్కా',
  'Beer': 'బీర్',
  'Wine': 'వైన్',
  'Rum': 'రమ్',
  'Gin': 'జిన్',
  'Brandy': 'బ్రాందీ',
  'Cognac': 'కాగ్నాక్',
  'Premium': 'ప్రీమియం',
  'Reserve': 'రిజర్వ్',
  'Gold': 'గోల్డ్',
  'Black': 'బ్లాక్',
  'White': 'వైట్',
  'Red': 'రెడ్',
  'Blue': 'బ్లూ',
  'Original': 'ఒరిజినల్',
  'Classic': 'క్లాసిక్',
  'Imported': 'ఇంపోర్టెడ్',
  'Dry': 'డ్రై',
  'Dark': 'డార్క్',
  'Spiced': 'స్పైస్డ్',
  'Triple Distilled': 'ట్రిపుల్ డిస్టిల్డ్',
  'Ale': 'ఏల్',
  'Lager': 'లేగర్'
};

const translations = {
  en: {
    roles: {
      customer: 'Customer',
      retailer: 'Retailer',
      admin: 'Excise Admin'
    },
    zones: {
      madhapur: 'Madhapur & HITEC City (500081)',
      jubilee: 'Jubilee Hills (500033)',
      banjara: 'Banjara Hills (500034)',
      gachibowli: 'Gachibowli (500032)',
      kondapur: 'Kondapur (500084)'
    },
    nav: {
      brandTitle: 'AlcoRez',
      subTitle: 'Reserve. Verify. Collect.',
      permittedAreas: 'Permitted Service Areas',
      searchPlaceholder: 'Search premium whisky, wine, beer, gin, vodka...',
      switchPersona: 'Switch Persona',
      currentActiveRole: 'Current Active Role',
      quickDemoSwitcher: 'Quick Demo Switcher',
      logout: 'Log out',
      login: 'Login',
      signInCustom: 'Sign in with custom credentials',
      orders: 'Orders',
      retailerPortal: 'Retailer Portal',
      adminPortal: 'Excise Admin',
      browseAll: 'Browse All Products',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      themeToggle: 'Toggle Theme',
      languageToggle: 'Change Language',
      teluguLang: 'తెలుగు',
      englishLang: 'English'
    },
    banner: {
      demoOnly: 'DEMO ONLY',
      exciseCompliance: 'Telangana Excise Compliance:',
      exciseText: 'Alcohol sales & doorstep delivery are strictly regulated. All checkouts simulate test orders only. Live transactions disabled.',
      legalNotice: 'Legal Notice'
    },
    age: {
      title: 'Statutory Age Verification',
      department: 'Government of Telangana — Prohibition & Excise',
      legalNotice: 'Under the Telangana Excise Act, 1968, you must be at least 21 years of age to access alcoholic beverage information, product listings, and licensed retailer catalogues.',
      demoNoticeTitle: '⚖️ Demonstration Notice:',
      demoNoticeText: 'This portal is a technology prototype for product discovery. Online checkout and doorstep alcohol delivery are strictly disabled in compliance with state regulations.',
      confirmAge: 'I am 21 or Older',
      underAge: 'I am Under 21'
    },
    home: {
      heroBadge: 'Telangana Excise Compliant Discovery',
      heroTitle: 'Discover Premium Spirits & Verified Wine Retailers in Telangana',
      heroHighlight: 'Wine Retailers',
      heroDesc: 'Explore authentic beverage catalogues, check bottle sizes and demonstration pricing, and verify authorized A4 retail wine shops across Hyderabad.',
      disclosureTitle: 'Statutory & Prototype Disclosure:',
      disclosureText: 'Commercial alcohol sales and doorstep delivery are strictly regulated under the Telangana Excise Act. This platform provides catalog discovery and simulated demonstration checkouts only.',
      exploreBtn: 'Explore Full Catalogue',
      guidelinesBtn: 'Legal Guidelines',
      browseCategory: 'Browse by Category',
      categorySubtitle: 'Curated alcoholic beverage categories',
      viewAll: 'View All',
      exploreChip: 'Explore',
      featuredTitle: 'Popular Brands & Malts',
      featuredBadge: 'Mock Demonstrative Data',
      featuredSubtitle: 'Trending selections with verified retailer availability',
      retailersTitle: 'Verified Wine Retailers',
      retailersBadge: 'A4 Excise License',
      retailersSubtitle: 'Officially gazetted retail wine outlets in Hyderabad',
      allRetailers: 'All Retailers',
      seeMore: 'See More',
      frameworkTag: 'Security & Regulatory Framework',
      frameworkTitle: 'Built on Telangana Excise Compliance Principles',
      frameworkDesc: 'Our platform adheres strictly to the legal landscape governing alcoholic beverages in Telangana State.',
      pillar1Title: 'Statutory Age Verification',
      pillar1Desc: 'Automated age verification barriers enforce the mandatory 21+ legal purchasing age under Telangana Excise rules.',
      pillar2Title: 'Strict License Verification',
      pillar2Desc: 'Only wine shops possessing valid A4 excise licenses issued by the Telangana Prohibition & Excise Department can publish inventory.',
      pillar3Title: 'Simulated Safe Checkout',
      pillar3Desc: 'Live payments and physical home delivery are completely disabled by default until explicit regulatory sanction is granted.',
      retailerApplyBannerTitle: 'Are you a licensed Telangana A4 Wine Retailer?',
      retailerApplyBannerDesc: 'Register your store inventory, showcase your authentic pricing, and connect with compliant consumers legally.',
      retailerApplyBtn: 'Apply for Retailer Onboarding'
    },
    product: {
      demoBadge: 'DEMO',
      outOfStock: 'Out of Stock at Verified Retailers',
      demoPriceLabel: 'Demonstration Price',
      detailsBtn: 'Details',
      addToCartBtn: 'Add to Cart',
      addBtn: 'Add',
      addedBtn: 'Added',
      addingBtn: 'Adding...',
      addedSuccess: 'Added to cart!',
      loginRequired: 'Please log in to add items to your cart.',
      priceOnRequest: 'Price on request'
    },
    productDetail: {
      backToCatalog: 'Back to Catalogue',
      demoListing: 'DEMO LISTING',
      origin: 'Origin:',
      exciseVerified: 'Excise Verified',
      availableAtRetailers: 'Available at Licensed Wine Shops',
      noStock: 'No approved retailer currently has stock listed for this item.',
      inStockUnits: 'In Stock',
      outOfStock: 'Out of Stock',
      quantity: 'Quantity:',
      total: 'Total:',
      addToDemoCart: 'Add to Demo Cart',
      viewCart: 'View Cart',
      addedSuccess: 'Added to demonstration cart successfully.',
      statutoryNoticeTitle: 'Statutory Demonstration Notice',
      defaultDescription: 'Authentic alcoholic beverage verified against approved Telangana State Excise catalogues.',
      loginRequired: 'Please log in (or select a demo profile from the top bar) to add items to your cart.',
      unavailableTitle: 'Product Unavailable',
      unavailableDesc: 'Product could not be retrieved or is currently inactive.',
      returnCatalog: 'Return to Catalogue'
    },
    retailer: {
      licenseNo: 'Lic. No:',
      rating: 'Rating',
      viewStore: 'View Store Inventory',
      defaultTradeName: 'Licensed Retail Wine Merchant',
      verifiedBadge: 'Verified A4 License'
    },
    retailerDash: {
      onboardingTitle: 'Retailer Onboarding & Dashboard',
      onboardingDesc: 'To access the licensed retailer portal, please submit an excise onboarding application or switch to a demo retailer profile.',
      switchToDemo: 'Switch to Demo Retailer (Madhapur Wines)',
      submitApplication: 'Submit Retailer Application',
      loading: 'Loading retailer dashboard...',
      manageInventory: 'Manage Inventory',
      viewTestOrders: 'View Test Orders',
      catalogueListings: 'Catalogue Listings',
      totalActiveSkus: 'Total active SKUs published',
      inStockSkus: 'In-Stock SKUs',
      availableCustomer: 'Available for customer discovery',
      lowStockSkus: 'Low Stock SKUs',
      belowThreshold: 'Below 5 units threshold',
      simulatedOrders: 'Simulated Orders',
      testOrdersReceived: 'Test orders received for testing',
      licenseRecords: 'Excise License Records',
      licenseNumber: 'License Number:',
      licenseClassification: 'License Classification:',
      a4RetailWineShop: 'A4 Retail Wine Shop',
      issuingAuthority: 'Issuing Authority:',
      govtAuthority: 'Prohibition & Excise Department, Govt of Telangana',
      validityPeriod: 'Validity Period:',
      exciseVerification: 'Excise Verification:',
      verifiedActive: 'Verified & Active',
      pendingVerification: 'Pending Manual Verification',
      operatingRestrictions: 'Telangana Wine Merchant Operating Restrictions',
      conditionsIntro: 'Under Telangana State Prohibition & Excise department conditions:',
      restriction1: 'Retailers are legally prohibited from executing doorstep alcohol delivery.',
      restriction2: 'All prices published must strictly respect state-mandated Maximum Retail Prices (MRP).',
      restriction3: 'Sales to persons under 21 years of age are punishable offenses under Section 34 of the Act.',
      restriction4: 'Dry day sales must be strictly halted according to state excise notifications.',
      underReview: 'Under Review',
      approved: 'Approved',
      licenseTag: 'License:'
    },
    inventory: {
      title: 'Store Inventory Management',
      subtitle: 'Manage bottle sizes, published MRP demonstration pricing and stock availability',
      addBtn: 'Add Product Listing',
      searchPlaceholder: 'Search store inventory by brand, name or category...',
      thProduct: 'Product & Brand',
      thCategory: 'Category',
      thSize: 'Size',
      thPrice: 'Price (MRP ₹)',
      thStock: 'Stock Units',
      thStatus: 'Listing Status',
      thActions: 'Actions',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      noItems: 'No inventory listings found.'
    },
    catalog: {
      title: 'Beverage Catalogue',
      subtitle: 'Browse state-registered spirits, wines, beers and imported labels',
      filters: 'Filters',
      clearAll: 'Clear All Filters',
      category: 'Category',
      allCategories: 'All Categories',
      retailerFilter: 'Retailer Location',
      allRetailers: 'All Approved Shops',
      bottleSize: 'Bottle Size',
      allSizes: 'All Sizes',
      sortBy: 'Sort By',
      nameAsc: 'Name (A to Z)',
      nameDesc: 'Name (Z to A)',
      priceAsc: 'Price (Low to High)',
      priceDesc: 'Price (High to Low)',
      noProducts: 'No products found matching your criteria.',
      showingResults: 'items found',
      disclaimerTitle: 'Excise Disclaimer:',
      disclaimerDesc: 'Only active products belonging to approved wine retailers are displayed.'
    },
    cart: {
      title: 'Shopping Cart',
      itemSelected: 'item(s) selected for simulated demonstration checkout',
      emptyTitle: 'Your bag is empty',
      emptyDesc: 'Explore our catalog of authentic spirits and wines from licensed Hyderabad retailers.',
      startBrowsing: 'Start Browsing Catalogue',
      orderSummary: 'Order Summary (Simulated)',
      subtotal: 'Item Subtotal',
      exciseCess: 'Excise & Statutory Cess',
      deliveryFee: 'Home Delivery Fee',
      disabledBadge: 'Disabled',
      totalEstimated: 'Total Demonstration Value',
      demoCheckoutBtn: 'Proceed to Simulated Checkout',
      noticeText: 'All orders placed are technological demonstrations only. No financial charges are levied, and no actual alcohol delivery will be fulfilled.',
      signInPrompt: 'Sign in to view your cart',
      signInDesc: 'Use custom credentials or choose a quick demo persona from the top navigation bar.',
      signInBtn: 'Sign In'
    },
    checkout: {
      title: 'Simulated Order Checkout',
      subtitle: 'Review pickup details, state excise declaration, and simulated test order',
      stepDesc: 'Step 2 of 2 • Prototype order creation and test payment verification',
      statutoryAlertTitle: 'Legal Clearances Pending — Alcohol Transaction Flow Disabled by Default',
      statutoryAlertText: 'Under the Telangana Excise Act, 1968, retail alcohol delivery and online payments are strictly prohibited for wine shops. This checkout creates a simulated test order to evaluate platform mechanics. No actual alcohol will be packed or dispatched.',
      deliveryAddressTitle: 'Hyderabad Delivery Address (Demonstration Location)',
      addNewAddress: 'Add New Address',
      addNewAddressTitle: 'Add New Hyderabad Address',
      label: 'Label',
      labelPlaceholder: 'e.g. Home, Office',
      postalCode: 'Postal Code',
      postalCodePlaceholder: 'e.g. 500081',
      addressLine1: 'Address Line 1',
      addressLine1Placeholder: 'Flat / House / Building',
      saveAddress: 'Save Address',
      cancel: 'Cancel',
      defaultBadge: 'Default',
      noSavedAddress: 'No saved addresses found. You can add one above or proceed with in-store pickup demonstration.',
      paymentGatewayTitle: 'Simulated Payment Gateway',
      simulateSuccessTitle: 'Simulate Gateway Approval (Instant Success)',
      simulateSuccessDesc: 'Creates test order with SUCCESS status and snapshots pricing',
      recommended: 'Recommended',
      simulateFailureTitle: 'Simulate Gateway Rejection / Failure',
      simulateFailureDesc: 'Simulates a declined card transaction response',
      testFailure: 'Test Failure',
      notesLabel: 'Customer / Simulation Notes (Optional)',
      notesPlaceholder: 'e.g. Test simulated order for demonstration review',
      orderReview: 'Order Review',
      qty: 'Qty:',
      subtotal: 'Subtotal',
      homeDelivery: 'Home Delivery',
      deliveryDisabled: '₹0.00 (Disabled)',
      taxes: 'Taxes',
      taxesDemo: '₹0.00 (Demo)',
      demonstrationValue: 'Demonstration Value',
      simulatingOrder: 'Simulating Order...',
      placeSimulatedOrder: 'Place Simulated Order',
      prototypeNotice: 'This prototype does NOT connect to a real banking gateway or merchant acquirer. Order records are created in test status for technical validation.',
      cartEmpty: 'Your cart is empty',
      browseProducts: 'Browse Products'
    },
    orderConfirmation: {
      steps: {
        created: 'Order Created',
        confirmed: 'Retailer Confirmed',
        preparing: 'Packing & Preparing',
        ready: 'Ready at Store',
        completed: 'Completed (Simulated)'
      },
      orderSuccessTitle: 'Simulated Test Order Created Successfully!',
      orderSuccessDesc: 'Your demonstration order has been logged. Under Telangana Excise Regulations, this test order evaluates catalogue routing and mock inventory decrements.',
      simulatedBadge: 'SIMULATED DEMONSTRATION ORDER',
      liveBadge: 'LIVE ORDER',
      placedOn: 'Placed on',
      currentStatus: 'Current Order Status',
      workflowTitle: 'Simulated Workflow State Machine',
      stepPrefix: 'Step',
      assignedRetailer: 'Assigned Licensed Retailer',
      retailerSub: 'Retail Wine Shop (A4 Excise Holder)',
      deliverySnapshot: 'Delivery / Pickup Snapshot',
      simulatedAddressRecord: 'Simulated Address Record',
      purchasedItems: 'Purchased Item Snapshots (Immutable Audit)',
      brandLabel: 'Brand:',
      unitDemoPrice: 'Unit Demonstration Price:',
      qtyLabel: 'Qty:',
      doorstepLogistics: 'Doorstep Logistics',
      logisticsDisabled: '₹0.00 (Delivery Disabled by Law)',
      simulatedTotal: 'Simulated Total',
      clearanceTitle: 'Statutory Demonstration Clearance Notice',
      clearanceText: 'This test order does not constitute a legally binding excise transport pass or commercial invoice. Licensed retailers under Telangana Excise Act are prohibited from doorstep dispatch without explicit government clearance.',
      viewPastOrders: 'View Past Test Orders',
      continueBrowsing: 'Continue Browsing',
      retrieving: 'Retrieving simulated order details...',
      notFound: 'Order not found',
      viewAllOrders: 'View All Orders'
    },
    ordersHistory: {
      title: 'My Orders & Experience Reviews',
      subtitle: 'Review previous demonstration orders for',
      customerAccount: 'Customer Account',
      ageVerified: 'Telangana Age Verified (21+)',
      refresh: 'Refresh',
      exploreCatalogue: 'Explore Catalogue',
      totalOrders: 'Total Orders',
      activeOrders: 'Active Orders',
      inProgress: 'in progress',
      demonstrationSpend: 'Demonstration Spend',
      complianceStatus: 'Telangana Compliance',
      passClear: 'Pass Clear (Demo)',
      tabAll: 'All Orders',
      tabActive: 'Active',
      tabCompleted: 'Completed',
      searchPlaceholder: 'Search by Order #, Retailer or Product...',
      noMatchingOrders: 'No matching orders found',
      noOrdersYet: 'No previous orders yet',
      noMatchingDesc: 'Try modifying your search keywords or resetting status filters to find previous orders.',
      noOrdersDesc: 'Add products to your cart and complete a simulated demonstration checkout to review past orders and tracking.',
      resetFilters: 'Reset Filters',
      browseCatalogue: 'Browse Telangana Catalogue',
      simulatedBadge: 'SIMULATED',
      lineItems: 'line item(s)',
      testAmount: 'Test Amount',
      trackStatus: 'Track Status',
      hideDetails: 'Hide item details',
      reviewDetails: 'Review item details',
      deliveryAddressSnapshot: 'Delivery / Pickup Address',
      auditPaymentStatus: 'Audit Note & Payment Status',
      paymentLabel: 'Payment:',
      orderedItemsReview: 'Ordered Items Review',
      snapshotNotice: 'Snapshot at time of order',
      brandLabel: 'Brand:',
      unitLabel: 'Unit:',
      qtyLabel: 'Qty:',
      noLineItems: 'No individual line items captured.',
      reviewInvoice: 'Review Invoice / Receipt',
      rateReview: 'Rate & Review Experience',
      subtotalLabel: 'Subtotal:',
      logisticsLabel: 'Logistics: ₹0 (Demo)',
      totalLabel: 'Total:',
      statutoryNoticeHeading: 'Telangana Regulatory Notice Regarding Order Records:',
      statutoryNoticeDesc: 'All orders presented in this portal are part of an authorized demonstration environment evaluating digital catalogues and excise traceability under the Telangana Excise Act, 1968. In accordance with current state statutes, no alcohol home dispatch or commercial transactions are fulfilled.',
      rateModalTitle: 'Rate & Review Retailer Experience',
      ratingLabel: 'Rating',
      ratingExcellent: 'Excellent',
      ratingGood: 'Good',
      ratingAverage: 'Average',
      ratingImprovement: 'Needs Improvement',
      feedbackLabel: 'Order Feedback / Review Comments',
      feedbackPlaceholder: 'Share details on retailer catalogue accuracy, bottle availability, or service speed...',
      submitReview: 'Submit Review',
      thankYouReview: 'Thank you for your review!',
      feedbackRecorded: 'Your feedback has been recorded for excise quality assurance.',
      invoiceModalTitle: 'Simulated Tax Invoice / Voucher',
      licensedShop: 'Licensed Retail Wine Shop',
      licenseCategory: 'Telangana Excise License Category A4 (Retail Off-Premises)',
      itemDescription: 'Item Description',
      amount: 'Amount',
      itemSubtotal: 'Item Subtotal:',
      homeLogistics: 'Home Logistics:',
      cessDemo: 'Telangana Excise Cess (Demo):',
      totalDemoValue: 'Total Demonstration Value:',
      statutoryCaveat: 'Statutory Caveat: This receipt is generated by the Alco Prototype for educational demonstration. It is not an excise transport permit.',
      printVoucher: 'Print Voucher',
      signInToReview: 'Sign in to Review Your Orders',
      signInDesc: 'Access your past simulated transactions, inspect itemized invoices, and review order fulfillment status.',
      signInBtn: 'Sign In',
      retailerNoticeTitle: 'Retailer Portal Notice',
      retailerNoticeDesc: 'You are currently signed in with a Licensed Retailer account. Customer purchase history is reserved for consumers. To review and fulfill store orders, please navigate to your Retailer Orders portal.',
      openRetailerOrders: 'Open Retailer Orders',
      adminNoticeTitle: 'Excise Administrator Notice',
      adminNoticeDesc: 'You are signed in as an Excise Administrator. Regulatory inspection, retailer licensing, and immutable audit logs are managed from the Administrator Dashboard.',
      openAdminDashboard: 'Open Admin Dashboard'
    },
    auth: {
      signInTitle: 'Sign In to Your Account',
      signInPlatform: 'Telangana Alcoholic Beverage Marketplace Platform',
      quickDemoTitle: 'Quick 1-Click Demo Personas',
      emailAddress: 'Email Address',
      emailPlaceholder: 'you@domain.com',
      password: 'Password',
      authenticating: 'Authenticating...',
      signIn: 'Sign In',
      noAccount: "Don't have an account?",
      registerCustomer: 'Register (21+ Customer)',
      createAccountTitle: 'Create Account',
      createAccountForRole: 'Create {role} Account',
      platformSub: 'Telangana State Liquor Discovery & Verified Retailer Platform',
      selectRole: 'Select Account Type / Role',
      fullName: 'Full Name',
      phone: 'Phone Number',
      dob: 'Date of Birth (21+ Mandatory)',
      selectStore: 'Select Associated Licensed Wine Store',
      chooseStore: '-- Select verified A4 store --',
      storeNotice: 'If your store is not listed, proceed to register and complete the excise license application.',
      termsConfirm: 'I declare under penalty of perjury that I am 21 years of age or older and agree to comply strictly with the Telangana Excise Act, 1968.',
      creatingAccount: 'Creating Account...',
      createAccountBtn: 'Create Account',
      alreadyAccount: 'Already have an account?',
      loginLink: 'Sign in instead'
    },
    compliance: {
      title: 'Telangana Excise Statutory Governance & Legal Disclosures',
      subtitle: 'Public disclosure under the Telangana Excise Act, 1968 and applicable government notifications.',
      returnHome: 'Return to Marketplace',
      sec1Title: '1. Regulatory Operating Principles',
      sec1Desc: 'The commercial trade, transport, and delivery of alcoholic beverages within the State of Telangana are strictly governed by the Telangana Excise Act, 1968, under the regulatory authority of the Prohibition & Excise Department. Standard retail wine licenses (Form A4) authorize brick-and-mortar sales from licensed premises only.',
      sec2Title: '2. Technological Prototype & Demonstration Mode',
      sec2Desc: 'This platform operates in a strict technology demonstration mode. Under this mode: Catalogue browsing and retail wine shop discovery are permitted; Simulated checkouts and test orders are permitted to validate user experience; Live payment processing is strictly disabled and blocked by server-side policy; Doorstep alcohol delivery dispatch is permanently blocked.',
      sec3Title: '3. Statutory Age Restrictions (21+ Mandatory)',
      sec3Desc: 'Under Telangana Excise rules, sales of alcoholic beverages to any person below 21 years of age are strictly prohibited. All user accounts must undergo statutory age verification before accessing demonstrative ordering functions.',
      sec4Title: '4. State Excise Department Contacts & Helplines',
      govtDept: 'Government of Telangana — Prohibition & Excise Department',
      deptAddress: 'State Excise Headquarters, Nampally Station Road, Hyderabad, 500001',
      tollFree: 'State Toll-Free Helpline: 1800-425-2523'
    },
    footer: {
      statutoryWarning: '⚠️ STATUTORY WARNING: CONSUMPTION OF ALCOHOL IS INJURIOUS TO HEALTH • BE SAFE — DON\'T DRINK AND DRIVE',
      statutoryDetails: 'Under the provisions of the Telangana Excise Act, 1968, sale of liquor to persons below 21 years of age is strictly prohibited. This marketplace platform operates in a technological demonstration mode for licensed retailer discovery. Commercial online payments and alcohol delivery dispatch are strictly disabled.',
      platformTitle: 'Alco',
      platformDesc: 'A modern digital catalogue assisting consumers in discovering verified products and authorized A4 wine shops in Telangana.',
      failClosed: 'Fail-Closed Regulatory Architecture',
      zonesTitle: 'Hyderabad Retail Zones',
      governanceTitle: 'Regulatory Governance',
      deptTitle: 'Prohibition & Excise Dept',
      govtOfTelangana: 'Government of Telangana\nNampally, Hyderabad, 500001',
      tollFree: 'Toll Free Helpline: 1800-425-2523',
      copyright: 'Alco Prototype. Demonstration dataset only.',
      techStack: 'Built with FastAPI, React, PostgreSQL & Tailwind CSS • 21+ Statutory Gate Active'
    }
  },
  te: {
    roles: {
      customer: 'కస్టమర్',
      retailer: 'రిటైలర్',
      admin: 'ఎక్సైజ్ అడ్మిన్'
    },
    zones: {
      madhapur: 'మాదాపూర్ & హైటెక్ సిటీ (500081)',
      jubilee: 'జూబ్లీ హిల్స్ (500033)',
      banjara: 'బంజారా హిల్స్ (500034)',
      gachibowli: 'గచ్చిబౌలి (500032)',
      kondapur: 'కొండాపూర్ (500084)'
    },
    nav: {
      brandTitle: 'AlcoRez',
      subTitle: 'Reserve. Verify. Collect.',
      permittedAreas: 'అనుమతించబడిన సర్వీస్ ప్రాంతాలు',
      searchPlaceholder: 'ప్రీమియం విస్కీ, వైన్, బీర్, జిన్, వోడ్కా శోధించండి...',
      switchPersona: 'పాత్రను మార్చండి',
      currentActiveRole: 'ప్రస్తుత క్రియాశీల పాత్ర',
      quickDemoSwitcher: 'డెమో ఖాతా స్విచ్చర్',
      logout: 'లాగ్ అవుట్',
      login: 'లాగిన్',
      signInCustom: 'ఖాతా వివరాలతో లాగిన్ అవ్వండి',
      orders: 'ఆర్డర్లు',
      retailerPortal: 'రిటైలర్ పోర్టల్',
      adminPortal: 'ఎక్సైజ్ అడ్మిన్',
      browseAll: 'అన్ని ఉత్పత్తులు చూడండి',
      darkMode: 'డార్క్ మోడ్',
      lightMode: 'లైట్ మోడ్',
      themeToggle: 'థీమ్ మార్చండి',
      languageToggle: 'భాష మార్చండి',
      teluguLang: 'తెలుగు',
      englishLang: 'English'
    },
    banner: {
      demoOnly: 'డెమో మాత్రమే',
      exciseCompliance: 'తెలంగాణ ఎక్సైజ్ నిబంధనలు:',
      exciseText: 'మద్యం అమ్మకాలు మరియు ఇంటి వద్దకు డెలివరీ రాష్ట్ర చట్టాల ప్రకారం నిషేధం. చెక్అవుట్‌లు పరీక్షా డెమో మాత్రమే. లైవ్ చెల్లింపులు నిలిపివేయబడ్డాయి.',
      legalNotice: 'చట్టపరమైన నోటీసు'
    },
    age: {
      title: 'చట్టబద్ధమైన వయస్సు ధృవీకరణ',
      department: 'తెలంగాణ ప్రభుత్వం — నిషేధం మరియు ఎక్సైజ్ శాఖ',
      legalNotice: 'తెలంగాణ ఎక్సైజ్ చట్టం, 1968 ప్రకారం, మద్యం సమాచారం, ఉత్పత్తుల వివరాలు మరియు లైసెన్స్ పొందిన దుకాణాల కేటలాగ్‌లను చూడటానికి మీ వయస్సు కనీసం 21 సంవత్సరాలు ఉండాలి.',
      demoNoticeTitle: '⚖️ డెమో సూచన:',
      demoNoticeText: 'ఈ పోర్టల్ కేవలం ఉత్పత్తుల వివరాల అన్వేషణ కోసం మాత్రమే రూపొందించబడింది. ఆన్‌లైన్ చెల్లింపులు మరియు డోర్‌స్టెప్ మద్యం డెలివరీ పూర్తిగా నిలిపివేయబడ్డాయి.',
      confirmAge: 'నా వయస్సు 21 లేదా అంతకంటే ఎక్కువ',
      underAge: 'నా వయస్సు 21 కంటే తక్కువ'
    },
    home: {
      heroBadge: 'తెలంగాణ ఎక్సైజ్ నిబంధనల ప్రకారం ధృవీకరించబడింది',
      heroTitle: 'తెలంగాణలో ప్రీమియం లిక్కర్ మరియు అధీకృత వైన్ షాపులను అన్వేషించండి',
      heroHighlight: 'వైన్ షాపులు',
      heroDesc: 'నమ్మకమైన పానీయాల కేటలాగ్‌లను చూడండి, బాటిల్ పరిమాణాలు మరియు డెమో ధరలను తనిఖీ చేయండి, హైదరాబాద్ వ్యాప్తంగా లైసెన్స్ పొందిన A4 మద్యం దుకాణాలను కనుగొనండి.',
      disclosureTitle: 'చట్టబద్ధమైన & డెమో ప్రకటన:',
      disclosureText: 'తెలంగాణ ఎక్సైజ్ చట్టం ప్రకారం వాణిజ్య మద్యం అమ్మకాలు మరియు హోమ్ డెలివరీ పూర్తిగా నియంత్రించబడ్డాయి. ఈ ప్లాట్‌ఫారమ్ కేవలం కేటలాగ్ మరియు సిమ్యులేటెడ్ చెక్అవుట్ డెమో మాత్రమే అందిస్తుంది.',
      exploreBtn: 'పూర్తి కేటలాగ్ చూడండి',
      guidelinesBtn: 'చట్టపరమైన మార్గదర్శకాలు',
      browseCategory: 'కేటగిరీల వారీగా చూడండి',
      categorySubtitle: 'ఎంపిక చేసిన నాణ్యమైన పానీయాల రకాలు',
      viewAll: 'అన్నీ చూడండి',
      exploreChip: 'అన్వేషించండి',
      featuredTitle: 'ప్రముఖ బ్రాండ్లు & మాల్ట్స్',
      featuredBadge: 'డెమో ప్రదర్శన డేటా',
      featuredSubtitle: 'లైసెన్స్డ్ షాపుల్లో అందుబాటులో ఉన్న ట్రెండింగ్ పానీయాలు',
      retailersTitle: 'ధృవీకరించబడిన వైన్ షాపులు',
      retailersBadge: 'A4 ఎక్సైజ్ లైసెన్స్',
      retailersSubtitle: 'హైదరాబాద్‌లో అధికారికంగా లైసెన్స్ పొందిన మద్యం దుకాణాలు',
      allRetailers: 'అన్ని దుకాణాలు',
      seeMore: 'మరిన్ని చూడండి',
      frameworkTag: 'భద్రత & చట్టబద్ధమైన నియంత్రణ ఫ్రేమ్‌వర్క్',
      frameworkTitle: 'తెలంగాణ ఎక్సైజ్ నిబంధనల ఆధారంగా రూపొందించబడింది',
      frameworkDesc: 'మా ప్లాట్‌ఫారమ్ తెలంగాణ రాష్ట్రంలో మద్యం ఉత్పత్తుల నియంత్రణ చట్టాలను ఖచ్చితంగా పాటిస్తుంది.',
      pillar1Title: 'చట్టబద్ధమైన 21+ వయస్సు ధృవీకరణ',
      pillar1Desc: 'తెలంగాణ ఎక్సైజ్ నిబంధనల ప్రకారం 21 ఏళ్లు నిండినవారికి మాత్రమే మద్యం సమాచారం ప్రదర్శించేలా ఆటోమేటెడ్ వ్యవస్థ ఉంది.',
      pillar2Title: 'కఠినమైన లైసెన్స్ ధృవీకరణ',
      pillar2Desc: 'తెలంగాణ ప్రొహిబిషన్ & ఎక్సైజ్ శాఖ జారీ చేసిన అధికారిక A4 లైసెన్స్ ఉన్న దుకాణాలు మాత్రమే ఉత్పత్తులను ప్రదర్శించగలవు.',
      pillar3Title: 'సురక్షితమైన సిమ్యులేటెడ్ చెక్అవుట్',
      pillar3Desc: 'ప్రభుత్వ అనుమతి లేకుండా ప్రత్యక్ష ఆన్‌లైన్ చెల్లింపులు మరియు హోమ్ డెలివరీలు పూర్తిగా నిలిపివేయబడ్డాయి.',
      retailerApplyBannerTitle: 'మీరు తెలంగాణ లైసెన్స్ పొందిన A4 వైన్ రిటైలరా?',
      retailerApplyBannerDesc: 'మీ దుకాణ ఇన్వెంటరీని నమోదు చేయండి, అధికారిక ధరలను ప్రదర్శించండి మరియు చట్టబద్ధంగా కస్టమర్లతో కనెక్ట్ అవ్వండి.',
      retailerApplyBtn: 'రిటైలర్ ఆన్‌బోర్డింగ్ దరఖాస్తు'
    },
    product: {
      demoBadge: 'డెమో',
      outOfStock: 'ధృవీకరించబడిన షాపుల్లో స్టాక్ లేదు',
      demoPriceLabel: 'డెమో ధర',
      detailsBtn: 'వివరాలు',
      addToCartBtn: 'కార్ట్‌కు చేర్చు',
      addBtn: 'చేర్చు',
      addedBtn: 'చేర్చబడింది',
      addingBtn: 'చేర్చుతోంది...',
      addedSuccess: 'కార్ట్‌కు చేర్చబడింది!',
      loginRequired: 'కార్ట్‌కు జోడించడానికి దయచేసి లాగిన్ అవ్వండి.',
      priceOnRequest: 'ధర విచారించండి'
    },
    productDetail: {
      backToCatalog: 'కేటలాగ్‌కు తిరిగి వెళ్లండి',
      demoListing: 'డెమో జాబితా',
      origin: 'మూలం / దేశం:',
      exciseVerified: 'ఎక్సైజ్ ధృవీకరించబడింది',
      availableAtRetailers: 'లైసెన్స్ పొందిన వైన్ షాపుల్లో లభ్యత',
      noStock: 'ప్రస్తుతం ఏ దుకాణంలోనూ ఈ వస్తువు స్టాక్ లేదు.',
      inStockUnits: 'స్టాక్ ఉంది',
      outOfStock: 'స్టాక్ లేదు',
      quantity: 'పరిమాణం (బాటిల్స్):',
      total: 'మొత్తం విలువ:',
      addToDemoCart: 'డెమో కార్ట్‌కు జోడించండి',
      viewCart: 'కార్ట్ చూడండి',
      addedSuccess: 'డెమో కార్ట్‌కు విజయవంతంగా జోడించబడింది.',
      statutoryNoticeTitle: 'చట్టబద్ధమైన డెమో నోటీసు',
      defaultDescription: 'తెలంగాణ రాష్ట్ర ఎక్సైజ్ విభాగం ఆమోదించిన అధికారిక పానీయాల వివరాలు.',
      loginRequired: 'కార్ట్‌కు జోడించడానికి దయచేసి లాగిన్ అవ్వండి (లేదా పై మెను నుండి డెమో ఖాతాను ఎంచుకోండి).',
      unavailableTitle: 'ఉత్పత్తి అందుబాటులో లేదు',
      unavailableDesc: 'ఈ ఉత్పత్తి వివరాలు లోడ్ కాలేదు లేదా ప్రస్తుతం నిలిపివేయబడ్డాయి.',
      returnCatalog: 'తిరిగి కేటలాగ్‌కు వెళ్లండి'
    },
    retailer: {
      licenseNo: 'లైసెన్స్ నం:',
      rating: 'రేటింగ్',
      viewStore: 'షాపు ఇన్వెంటరీ చూడండి',
      defaultTradeName: 'లైసెన్స్ పొందిన రిటైల్ వైన్ వ్యాపారి',
      verifiedBadge: 'ధృవీకరించబడిన A4 లైసెన్స్'
    },
    retailerDash: {
      onboardingTitle: 'రిటైలర్ ఆన్‌బోర్డింగ్ & డాష్‌బోర్డ్',
      onboardingDesc: 'లైసెన్స్ పొందిన రిటైలర్ పోర్టల్‌ను యాక్సెస్ చేయడానికి, దయచేసి ఎక్సైజ్ ఆన్‌బోర్డింగ్ దరఖాస్తును సమర్పించండి లేదా డెమో ప్రొఫైల్‌కు మారండి.',
      switchToDemo: 'డెమో రిటైలర్‌కు మారండి (మాదాపూర్ వైన్స్)',
      submitApplication: 'రిటైలర్ దరఖాస్తును సమర్పించండి',
      loading: 'రిటైలర్ డాష్‌బోర్డ్ లోడ్ అవుతోంది...',
      manageInventory: 'ఇన్వెంటరీ నిర్వహణ',
      viewTestOrders: 'పరీక్షా ఆర్డర్లు చూడండి',
      catalogueListings: 'కేటలాగ్ జాబితాలు',
      totalActiveSkus: 'ప్రచురించిన మొత్తం యాక్టివ్ SKUs',
      inStockSkus: 'స్టాక్‌లో ఉన్న SKUs',
      availableCustomer: 'కస్టమర్లకు అందుబాటులో ఉన్నవి',
      lowStockSkus: 'తక్కువ స్టాక్ ఉన్న SKUs',
      belowThreshold: '5 యూనిట్ల కంటే తక్కువ పరిమితి',
      simulatedOrders: 'సిమ్యులేటెడ్ ఆర్డర్లు',
      testOrdersReceived: 'పరీక్ష కోసం అందుకున్న ఆర్డర్లు',
      licenseRecords: 'ఎక్సైజ్ లైసెన్స్ రికార్డులు',
      licenseNumber: 'లైసెన్స్ నంబర్:',
      licenseClassification: 'లైసెన్స్ వర్గీకరణ:',
      a4RetailWineShop: 'A4 రిటైల్ వైన్ షాప్',
      issuingAuthority: 'జారీ చేసిన అధికారి:',
      govtAuthority: 'నిషేధం & ఎక్సైజ్ శాఖ, తెలంగాణ ప్రభుత్వం',
      validityPeriod: 'చెల్లుబాటు వ్యవధి:',
      exciseVerification: 'ఎక్సైజ్ ధృవీకరణ:',
      verifiedActive: 'ధృవీకరించబడింది & క్రియాశీలం',
      pendingVerification: 'మాన్యువల్ ధృవీకరణ పెండింగ్‌లో ఉంది',
      operatingRestrictions: 'తెలంగాణ వైన్ వ్యాపార నిర్వహణ పరిమితులు',
      conditionsIntro: 'తెలంగాణ రాష్ట్ర నిషేధం & ఎక్సైజ్ శాఖ నిబంధనల ప్రకారం:',
      restriction1: 'రిటైలర్లు హోమ్ డెలివరీ చేయడం చట్టప్రకారం పూర్తిగా నిషేధించబడింది.',
      restriction2: 'ప్రచురించబడిన అన్ని ధరలు తప్పనిసరిగా ప్రభుత్వం నిర్ణయించిన గరిష్ట రిటైల్ ధరకు (MRP) లోబడి ఉండాలి.',
      restriction3: '21 ఏళ్ల లోపు వ్యక్తులకు విక్రయించడం ఎక్సైజ్ చట్టంలోని సెక్షన్ 34 ప్రకారం శిక్షార్హమైన నేరం.',
      restriction4: 'ఎక్సైజ్ నోటిఫికేషన్ల ప్రకారం డ్రై డేలలో విక్రయాలు పూర్తిగా నిలిపివేయాలి.',
      underReview: 'పరిశీలనలో ఉంది',
      approved: 'ఆమోదించబడింది',
      licenseTag: 'లైసెన్స్:'
    },
    inventory: {
      title: 'స్టోర్ ఇన్వెంటరీ నిర్వహణ',
      subtitle: 'బాటిల్ పరిమాణాలు, అధికారిక MRP ప్రదర్శన ధరలు మరియు స్టాక్ లభ్యతను నిర్వహించండి',
      addBtn: 'కొత్త ఉత్పత్తిని జోడించండి',
      searchPlaceholder: 'బ్రాండ్, పేరు లేదా కేటగిరీ ద్వారా ఇన్వెంటరీ శోధించండి...',
      thProduct: 'ఉత్పత్తి & బ్రాండ్',
      thCategory: 'కేటగిరీ',
      thSize: 'పరిమాణం',
      thPrice: 'ధర (MRP ₹)',
      thStock: 'స్టాక్ యూనిట్లు',
      thStatus: 'జాబితా స్థితి',
      thActions: 'చర్యలు',
      inStock: 'స్టాక్ ఉంది',
      outOfStock: 'స్టాక్ లేదు',
      save: 'సేవ్ చేయండి',
      cancel: 'రద్దు చేయండి',
      edit: 'సవరించండి',
      noItems: 'ఇన్వెంటరీ జాబితాలు ఏవీ కనుగొనబడలేదు.'
    },
    catalog: {
      title: 'పానీయాల కేటలాగ్',
      subtitle: 'రాష్ట్ర రిజిస్టర్డ్ విస్కీ, వైన్లు, బీర్లు మరియు దిగుమతి బ్రాండ్‌లను బ్రౌజ్ చేయండి',
      filters: 'ఫిల్టర్లు',
      clearAll: 'ఫిల్టర్లను క్లియర్ చేయండి',
      category: 'కేటగిరీ',
      allCategories: 'అన్ని కేటగిరీలు',
      retailerFilter: 'రిటైలర్ లొకేషన్',
      allRetailers: 'అన్ని ఆమోదిత దుకాణాలు',
      bottleSize: 'బాటిల్ పరిమాణం',
      allSizes: 'అన్ని పరిమాణాలు',
      sortBy: 'క్రమబద్ధీకరణ',
      nameAsc: 'పేరు (A నుండి Z)',
      nameDesc: 'పేరు (Z నుండి A)',
      priceAsc: 'ధర (తక్కువ నుండి ఎక్కువ)',
      priceDesc: 'ధర (ఎక్కువ నుండి తక్కువ)',
      noProducts: 'మీ ఫిల్టర్లకు సరిపోయే ఉత్పత్తులు ఏవీ లేవు.',
      showingResults: 'ఉత్పత్తులు కనుగొనబడ్డాయి',
      disclaimerTitle: 'ఎక్సైజ్ నిబంధన:',
      disclaimerDesc: 'ధృవీకరించబడిన లైసెన్స్డ్ వైన్ షాపుల చురుకైన ఉత్పత్తులు మాత్రమే ప్రదర్శించబడతాయి.'
    },
    cart: {
      title: 'షాపింగ్ కార్ట్',
      itemSelected: 'సిమ్యులేటెడ్ డెమో చెక్అవుట్ కోసం ఎంచుకున్న వస్తువులు',
      emptyTitle: 'మీ బ్యాగ్ ఖాళీగా ఉంది',
      emptyDesc: 'హైదరాబాద్ లైసెన్స్డ్ షాపుల నుండి అందుబాటులో ఉన్న కేటలాగ్‌ను చూడండి.',
      startBrowsing: 'కేటలాగ్ బ్రౌజింగ్ ప్రారంభించండి',
      orderSummary: 'ఆర్డర్ సారాంశం (డెమో)',
      subtotal: 'ఉత్పత్తుల ఉపమొత్తం',
      exciseCess: 'ఎక్సైజ్ & చట్టబద్ధమైన సెస్',
      deliveryFee: 'హోమ్ డెలివరీ రుసుము',
      disabledBadge: 'నిలిపివేయబడింది',
      totalEstimated: 'మొత్తం ప్రదర్శన విలువ',
      demoCheckoutBtn: 'సిమ్యులేటెడ్ చెక్అవుట్‌కు వెళ్లండి',
      noticeText: 'ఇక్కడ చేయబడిన అన్ని ఆర్డర్లు కేవలం సాంకేతిక డెమో మాత్రమే. ఎలాంటి డబ్బు తీసుకోబడదు మరియు మద్యం డెలివరీ చేయబడదు.',
      signInPrompt: 'మీ కార్ట్ చూడటానికి లాగిన్ అవ్వండి',
      signInDesc: 'ఖాతా వివరాలతో లాగిన్ అవ్వండి లేదా పై మెను నుండి డెమో ఖాతాను ఎంచుకోండి.',
      signInBtn: 'లాగిన్ అవ్వండి'
    },
    checkout: {
      title: 'సిమ్యులేటెడ్ ఆర్డర్ చెక్అవుట్',
      subtitle: 'పికప్ వివరాలు, ఎక్సైజ్ డిక్లరేషన్ మరియు పరీక్షా ఆర్డర్‌ను సమీక్షించండి',
      stepDesc: 'దశ 2 / 2 • ప్రోటోటైప్ ఆర్డర్ సృష్టి మరియు టెస్ట్ చెల్లింపు ధృవీకరణ',
      statutoryAlertTitle: 'చట్టబద్ధ అనుమతులు పెండింగ్‌లో ఉన్నాయి — మద్యం లావాదేవీల ప్రక్రియ నిలిపివేయబడింది',
      statutoryAlertText: 'తెలంగాణ ఎక్సైజ్ చట్టం, 1968 ప్రకారం, వైన్ షాపులకు ఆన్‌లైన్ చెల్లింపులు మరియు హోమ్ డెలివరీ నిషేధించబడింది. ఈ చెక్అవుట్ కేవలం ప్లాట్‌ఫారమ్ పనితీరును పరీక్షించడానికి సిమ్యులేటెడ్ టెస్ట్ ఆర్డర్‌ను సృష్టిస్తుంది. ఎలాంటి మద్యం ప్యాక్ చేయబడదు లేదా పంపబడదు.',
      deliveryAddressTitle: 'హైదరాబాద్ డెలివరీ చిరునామా (డెమో లొకేషన్)',
      addNewAddress: 'కొత్త చిరునామాను జోడించండి',
      addNewAddressTitle: 'కొత్త హైదరాబాద్ చిరునామాను జోడించండి',
      label: 'లేబుల్',
      labelPlaceholder: 'ఉదా. ఇల్లు, కార్యాలయం',
      postalCode: 'పోస్టల్ కోడ్ (పిన్ కోడ్)',
      postalCodePlaceholder: 'ఉదా. 500081',
      addressLine1: 'చిరునామా లైన్ 1',
      addressLine1Placeholder: 'ఫ్లాట్ / ఇల్లు / భవనం',
      saveAddress: 'చిరునామాను భద్రపరచండి',
      cancel: 'రద్దు చేయండి',
      defaultBadge: 'డిఫాల్ట్',
      noSavedAddress: 'సేవ్ చేసిన చిరునామాలు ఏవీ లేవు. మీరు పైన కొత్త చిరునామాను జోడించవచ్చు లేదా ఇన్-స్టోర్ పికప్ డెమోతో కొనసాగవచ్చు.',
      paymentGatewayTitle: 'సిమ్యులేటెడ్ పేమెంట్ గేట్‌వే',
      simulateSuccessTitle: 'గేట్‌వే ఆమోదాన్ని అనుకరించండి (తక్షణ విజయం)',
      simulateSuccessDesc: 'SUCCESS స్థితితో టెస్ట్ ఆర్డర్‌ను సృష్టిస్తుంది మరియు ధరలను భద్రపరుస్తుంది',
      recommended: 'సిఫార్సు చేయబడింది',
      simulateFailureTitle: 'గేట్‌వే తిరస్కరణ / వైఫల్యాన్ని అనుకరించండి',
      simulateFailureDesc: 'కార్డ్ లావాదేవీ తిరస్కరించబడిన సందర్భాన్ని అనుకరిస్తుంది',
      testFailure: 'టెస్ట్ వైఫల్యం',
      notesLabel: 'కస్టమర్ / సిమ్యులేషన్ గమనికలు (ఐచ్ఛికం)',
      notesPlaceholder: 'ఉదా. ప్రదర్శన సమీక్ష కోసం టెస్ట్ సిమ్యులేటెడ్ ఆర్డర్',
      orderReview: 'ఆర్డర్ సమీక్ష',
      qty: 'పరిమాణం:',
      subtotal: 'ఉపమొత్తం',
      homeDelivery: 'హోమ్ డెలివరీ',
      deliveryDisabled: '₹0.00 (నిలిపివేయబడింది)',
      taxes: 'పన్నులు',
      taxesDemo: '₹0.00 (డెమో)',
      demonstrationValue: 'ప్రదర్శన మొత్తం విలువ',
      simulatingOrder: 'ఆర్డర్ సిమ్యులేట్ అవుతోంది...',
      placeSimulatedOrder: 'సిమ్యులేటెడ్ ఆర్డర్ చేయండి',
      prototypeNotice: 'ఈ ప్రోటోటైప్ అసలైన బ్యాంకింగ్ గేట్‌వేకి కనెక్ట్ అవ్వదు. సాంకేతిక ధృవీకరణ కోసం టెస్ట్ స్థితిలో ఆర్డర్ రికార్డులు సృష్టించబడతాయి.',
      cartEmpty: 'మీ కార్ట్ ఖాళీగా ఉంది',
      browseProducts: 'ఉత్పత్తులను చూడండి'
    },
    orderConfirmation: {
      steps: {
        created: 'ఆర్డర్ సృష్టించబడింది',
        confirmed: 'రిటైలర్ ధృవీకరించారు',
        preparing: 'ప్యాకింగ్ జరుగుతోంది',
        ready: 'దుకాణంలో సిద్ధంగా ఉంది',
        completed: 'పూర్తయింది (సిమ్యులేటెడ్)'
      },
      orderSuccessTitle: 'సిమ్యులేటెడ్ టెస్ట్ ఆర్డర్ విజయవంతంగా సృష్టించబడింది!',
      orderSuccessDesc: 'మీ డెమో ఆర్డర్ నమోదైంది. తెలంగాణ ఎక్సైజ్ నిబంధనల ప్రకారం, ఈ టెస్ట్ ఆర్డర్ కేటలాగ్ రూటింగ్ మరియు ఇన్వెంటరీ నిర్వహణను పరీక్షిస్తుంది.',
      simulatedBadge: 'సిమ్యులేటెడ్ డెమో ఆర్డర్',
      liveBadge: 'లైవ్ ఆర్డర్',
      placedOn: 'ఆర్డర్ చేసిన తేదీ:',
      currentStatus: 'ప్రస్తుత ఆర్డర్ స్థితి',
      workflowTitle: 'సిమ్యులేటెడ్ వర్క్‌ఫ్లో స్టేట్ మెషిన్',
      stepPrefix: 'దశ',
      assignedRetailer: 'కేటాయించిన లైసెన్స్ పొందిన రిటైలర్',
      retailerSub: 'రిటైల్ వైన్ షాప్ (A4 ఎక్సైజ్ లైసెన్స్ హోల్డర్)',
      deliverySnapshot: 'డెలివరీ / పికప్ వివరాలు',
      simulatedAddressRecord: 'సిమ్యులేటెడ్ చిరునామా రికార్డు',
      purchasedItems: 'కొనుగోలు చేసిన వస్తువుల వివరాలు (ఆడిట్ రికార్డు)',
      brandLabel: 'బ్రాండ్:',
      unitDemoPrice: 'యూనిట్ డెమో ధర:',
      qtyLabel: 'పరిమాణం:',
      doorstepLogistics: 'డోర్‌స్టెప్ డెలివరీ',
      logisticsDisabled: '₹0.00 (చట్టప్రకారం డెలివరీ నిషేధం)',
      simulatedTotal: 'సిమ్యులేటెడ్ మొత్తం విలువ',
      clearanceTitle: 'చట్టబద్ధమైన డెమో అనుమతి నోటీసు',
      clearanceText: 'ఈ టెస్ట్ ఆర్డర్ చట్టపరమైన ఎక్సైజ్ రవాణా పాస్ లేదా వాణిజ్య ఇన్‌వాయిస్ కాదు. తెలంగాణ ఎక్సైజ్ చట్టం ప్రకారం ప్రభుత్వం నుండి అనుమతి లేకుండా రిటైలర్లు హోమ్ డెలివరీ చేయడం నిషేధం.',
      viewPastOrders: 'గత టెస్ట్ ఆర్డర్లు చూడండి',
      continueBrowsing: 'షాపింగ్ కొనసాగించండి',
      retrieving: 'ఆర్డర్ వివరాలు లోడ్ అవుతున్నాయి...',
      notFound: 'ఆర్డర్ కనుగొనబడలేదు',
      viewAllOrders: 'అన్ని ఆర్డర్లు చూడండి'
    },
    ordersHistory: {
      title: 'నా ఆర్డర్లు & అనుభవ సమీక్షలు',
      subtitle: 'గత ప్రదర్శన ఆర్డర్ల వివరాలు:',
      customerAccount: 'కస్టమర్ ఖాతా',
      ageVerified: 'తెలంగాణ వయస్సు ధృవీకరించబడింది (21+)',
      refresh: 'తాజాకరించండి',
      exploreCatalogue: 'కేటలాగ్ అన్వేషించండి',
      totalOrders: 'మొత్తం ఆర్డర్లు',
      activeOrders: 'యాక్టివ్ ఆర్డర్లు',
      inProgress: 'పురోగతిలో ఉన్నాయి',
      demonstrationSpend: 'ప్రదర్శన మొత్తం ఖర్చు',
      complianceStatus: 'తెలంగాణ నిబంధనల ఆమోదం',
      passClear: 'ఆమోదించబడింది (డెమో)',
      tabAll: 'అన్ని ఆర్డర్లు',
      tabActive: 'యాక్టివ్',
      tabCompleted: 'పూర్తయినవి',
      searchPlaceholder: 'ఆర్డర్ #, రిటైలర్ లేదా ఉత్పత్తి ద్వారా వెతకండి...',
      noMatchingOrders: 'సరిపోయే ఆర్డర్లు ఏవీ లేవు',
      noOrdersYet: 'ఇంకా ఎలాంటి గత ఆర్డర్లు లేవు',
      noMatchingDesc: 'గత ఆర్డర్లను కనుగొనడానికి శోధన పదాలను మార్చండి లేదా ఫిల్టర్లను రీసెట్ చేయండి.',
      noOrdersDesc: 'గత ఆర్డర్లు మరియు ట్రాకింగ్ చూడటానికి ఉత్పత్తులను కార్ట్‌కు జోడించి సిమ్యులేటెడ్ చెక్అవుట్ పూర్తి చేయండి.',
      resetFilters: 'ఫిల్టర్లను రీసెట్ చేయండి',
      browseCatalogue: 'తెలంగాణ కేటలాగ్ బ్రౌజ్ చేయండి',
      simulatedBadge: 'సిమ్యులేటెడ్',
      lineItems: 'వస్తువులు',
      testAmount: 'టెస్ట్ మొత్తం',
      trackStatus: 'స్థితిని ట్రాక్ చేయండి',
      hideDetails: 'వివరాలు దాచండి',
      reviewDetails: 'వివరాలు చూడండి',
      deliveryAddressSnapshot: 'డెలివరీ / పికప్ చిరునామా',
      auditPaymentStatus: 'ఆడిట్ నోట్ & చెల్లింపు స్థితి',
      paymentLabel: 'చెల్లింపు:',
      orderedItemsReview: 'ఆర్డర్ చేసిన వస్తువుల వివరాలు',
      snapshotNotice: 'ఆర్డర్ సమయానికి ఉన్న ధరల రికార్డు',
      brandLabel: 'బ్రాండ్:',
      unitLabel: 'యూనిట్:',
      qtyLabel: 'పరిమాణం:',
      noLineItems: 'లైన్ ఐటెమ్స్ ఏవీ నమోదు కాలేదు.',
      reviewInvoice: 'రసీదు / ఇన్‌వాయిస్ సమీక్షించండి',
      rateReview: 'అనుభవానికి రేటింగ్ & సమీక్ష ఇవ్వండి',
      subtotalLabel: 'ఉపమొత్తం:',
      logisticsLabel: 'రవాణా: ₹0 (డెమో)',
      totalLabel: 'మొత్తం:',
      statutoryNoticeHeading: 'ఆర్డర్ రికార్డులకు సంబంధించి తెలంగాణ ప్రభుత్వ నిబంధనల నోటీసు:',
      statutoryNoticeDesc: 'ఈ పోర్టల్‌లో ప్రదర్శించబడిన అన్ని ఆర్డర్లు తెలంగాణ ఎక్సైజ్ చట్టం, 1968 ప్రకారం డిజిటల్ కేటలాగ్ మరియు ఎక్సైజ్ పర్యవేక్షణను అంచనా వేసే డెమో మాత్రమే. ప్రస్తుత చట్టాల ప్రకారం ఎలాంటి మద్యం హోమ్ డెలివరీ లేదా అమ్మకాలు నిర్వహించబడవు.',
      rateModalTitle: 'రిటైలర్ అనుభవానికి రేటింగ్ ఇవ్వండి',
      ratingLabel: 'రేటింగ్',
      ratingExcellent: 'అత్యుత్తమం',
      ratingGood: 'మంచిది',
      ratingAverage: 'సాధారణం',
      ratingImprovement: 'మెరుగుపడాలి',
      feedbackLabel: 'ఆర్డర్ ఫీడ్‌బ్యాక్ / సమీక్ష వ్యాఖ్యలు',
      feedbackPlaceholder: 'రిటైలర్ కేటలాగ్ ఖచ్చితత్వం, బాటిల్ లభ్యత లేదా సేవా వేగంపై వివరాలను పంచుకోండి...',
      submitReview: 'సమీక్షను సమర్పించండి',
      thankYouReview: 'మీ సమీక్షకు ధన్యవాదాలు!',
      feedbackRecorded: 'ఎక్సైజ్ నాణ్యతా ప్రమాణాల కోసం మీ అభిప్రాయం నమోదు చేయబడింది.',
      invoiceModalTitle: 'సిమ్యులేటెడ్ టాక్స్ ఇన్‌వాయిస్ / రసీదు',
      licensedShop: 'లైసెన్స్ పొందిన రిటైల్ వైన్ షాప్',
      licenseCategory: 'తెలంగాణ ఎక్సైజ్ లైసెన్స్ వర్గం A4 (ఆఫ్-ప్రిమిసెస్ రిటైల్)',
      itemDescription: 'వస్తువు వివరాలు',
      amount: 'మొత్తం',
      itemSubtotal: 'వస్తువుల ఉపమొత్తం:',
      homeLogistics: 'హోమ్ డెలివరీ:',
      cessDemo: 'తెలంగాణ ఎక్సైజ్ సెస్ (డెమో):',
      totalDemoValue: 'మొత్తం ప్రదర్శన విలువ:',
      statutoryCaveat: 'చట్టపరమైన సూచన: ఈ రసీదు విద్యా ప్రదర్శన కోసం Alco ప్రోటోటైప్ ద్వారా రూపొందించబడింది. ఇది ఎక్సైజ్ రవాణా అనుమతి పత్రం కాదు.',
      printVoucher: 'రసీదు ప్రింట్ చేయండి',
      signInToReview: 'మీ ఆర్డర్లను సమీక్షించడానికి లాగిన్ అవ్వండి',
      signInDesc: 'మీ గత సిమ్యులేటెడ్ లావాదేవీలను యాక్సెస్ చేయండి, ఇన్‌వాయిస్‌లను పరిశీలించండి మరియు ఆర్డర్ స్థితిని సమీక్షించండి.',
      signInBtn: 'లాగిన్ అవ్వండి',
      retailerNoticeTitle: 'రిటైలర్ పోర్టల్ సూచన',
      retailerNoticeDesc: 'మీరు ప్రస్తుతం లైసెన్స్ పొందిన రిటైలర్ ఖాతాతో లాగిన్ అయి ఉన్నారు. కస్టమర్ కొనుగోలు చరిత్ర వినియోగదారుల కోసం మాత్రమే. స్టోర్ ఆర్డర్లను సమీక్షించడానికి, దయచేసి రిటైలర్ ఆర్డర్స్ పోర్టల్‌కు వెళ్లండి.',
      openRetailerOrders: 'రిటైలర్ ఆర్డర్లు తెరవండి',
      adminNoticeTitle: 'ఎక్సైజ్ అడ్మినిస్ట్రేటర్ సూచన',
      adminNoticeDesc: 'మీరు ఎక్సైజ్ అడ్మినిస్ట్రేటర్‌గా లాగిన్ అయ్యారు. నియంత్రణ తనిఖీలు, రిటైలర్ లైసెన్సింగ్ మరియు ఆడిట్ లాగ్‌లు అడ్మినిస్ట్రేటర్ డాష్‌బోర్డ్ నుండి నిర్వహించబడతాయి.',
      openAdminDashboard: 'అడ్మిన్ డాష్‌బోర్డ్ తెరవండి'
    },
    auth: {
      signInTitle: 'మీ ఖాతాలోకి లాగిన్ అవ్వండి',
      signInPlatform: 'తెలంగాణ ఆల్కహాలిక్ బెవరేజ్ మార్కెట్‌ప్లేస్ ప్లాట్‌ఫారమ్',
      quickDemoTitle: '1-క్లిక్ డెమో ప్రొఫైల్స్',
      emailAddress: 'ఈమెయిల్ చిరునామా',
      emailPlaceholder: 'you@domain.com',
      password: 'పాస్‌వర్డ్',
      authenticating: 'లాగిన్ అవుతోంది...',
      signIn: 'లాగిన్ అవ్వండి',
      noAccount: 'ఖాతా లేదా?',
      registerCustomer: 'రిజిస్టర్ చేసుకోండి (21+ కస్టమర్)',
      createAccountTitle: 'కొత్త ఖాతా సృష్టించండి',
      createAccountForRole: '{role} ఖాతాను సృష్టించండి',
      platformSub: 'తెలంగాణ రాష్ట్ర మద్యం సమాచార & ధృవీకృత రిటైలర్ ప్లాట్‌ఫారమ్',
      selectRole: 'ఖాతా రకాన్ని / పాత్రను ఎంచుకోండి',
      fullName: 'పూర్తి పేరు',
      phone: 'ఫోన్ నంబర్',
      dob: 'పుట్టిన తేదీ (కనీసం 21 ఏళ్లు నిండి ఉండాలి)',
      selectStore: 'సంబంధిత లైసెన్స్డ్ వైన్ షాపును ఎంచుకోండి',
      chooseStore: '-- ధృవీకరించబడిన A4 దుకాణాన్ని ఎంచుకోండి --',
      storeNotice: 'మీ దుకాణం జాబితాలో లేకపోతే, నమోదు చేసుకుని ఎక్సైజ్ లైసెన్స్ దరఖాస్తును పూర్తి చేయండి.',
      termsConfirm: 'నా వయస్సు 21 సంవత్సరాలు లేదా అంతకంటే ఎక్కువ అని మరియు తెలంగాణ ఎక్సైజ్ చట్టం, 1968 నిబంధనలకు ఖచ్చితంగా కట్టుబడి ఉంటానని ధృవీకరిస్తున్నాను.',
      creatingAccount: 'ఖాతా సృష్టించబడుతోంది...',
      createAccountBtn: 'ఖాతా సృష్టించండి',
      alreadyAccount: 'ఇప్పటికే ఖాతా ఉందా?',
      loginLink: 'లాగిన్ అవ్వండి'
    },
    compliance: {
      title: 'తెలంగాణ ఎక్సైజ్ చట్టబద్ధ పాలన & న్యాయ ప్రకటనలు',
      subtitle: 'తెలంగాణ ఎక్సైజ్ చట్టం, 1968 మరియు వర్తించే ప్రభుత్వ నోటిఫికేషన్ల ప్రకారం పబ్లిక్ ప్రకటన.',
      returnHome: 'మార్కెట్‌ప్లేస్‌కు తిరిగి వెళ్లండి',
      sec1Title: '1. నియంత్రణ & నిర్వహణ సూత్రాలు',
      sec1Desc: 'తెలంగాణ రాష్ట్రంలో మద్యం వ్యాపారం, రవాణా మరియు డెలివరీ తెలంగాణ ఎక్సైజ్ చట్టం, 1968 ప్రకారం ప్రొహిబిషన్ & ఎక్సైజ్ శాఖ నియంత్రణలో ఉంటాయి. ప్రామాణిక రిటైల్ వైన్ లైసెన్స్‌లు (ఫారం A4) భౌతిక దుకాణాల ప్రాంగణాల నుండి మాత్రమే అమ్మకాలను అనుమతిస్తాయి.',
      sec2Title: '2. సాంకేతిక నమూనా & డెమో మోడ్',
      sec2Desc: 'ఈ ప్లాట్‌ఫారమ్ ఖచ్చితమైన సాంకేతిక ప్రదర్శన మోడ్‌లో పనిచేస్తుంది. ఈ మోడ్ కింద: కేటలాగ్ చూడటం మరియు లైసెన్స్డ్ షాపులను అన్వేషించడం అనుమతించబడుతుంది; వినియోగదారు అనుభవాన్ని పరీక్షించడానికి సిమ్యులేటెడ్ చెక్అవుట్‌లు అనుమతించబడతాయి; లైవ్ ఆన్‌లైన్ చెల్లింపులు పూర్తిగా నిలిపివేయబడ్డాయి; మద్యం డోర్‌స్టెప్ డెలివరీ శాశ్వతంగా నిరోధించబడింది.',
      sec3Title: '3. చట్టబద్ధమైన వయస్సు పరిమితులు (21+ తప్పనిసరి)',
      sec3Desc: 'తెలంగాణ ఎక్సైజ్ నిబంధనల ప్రకారం, 21 సంవత్సరాల కంటే తక్కువ వయస్సు ఉన్న ఏ వ్యక్తికైనా మద్యం విక్రయించడం ఖచ్చితంగా నిషేధించబడింది. ప్రదర్శన ఆర్డర్ విధులను ఉపయోగించే ముందు వినియోగదారులు తప్పనిసరిగా వయస్సు ధృవీకరణను పూర్తి చేయాలి.',
      sec4Title: '4. రాష్ట్ర ఎక్సైజ్ శాఖ సంప్రదింపు వివరాలు & హెల్ప్‌లైన్లు',
      govtDept: 'తెలంగాణ ప్రభుత్వం — నిషేధం & ఎక్సైజ్ శాఖ',
      deptAddress: 'స్టేట్ ఎక్సైజ్ హెడ్‌క్వార్టర్స్, నాంపల్లి స్టేషన్ రోడ్, హైదరాబాద్, 500001',
      tollFree: 'రాష్ట్ర టోల్ ఫ్రీ హెల్ప్‌లైన్: 1800-425-2523'
    },
    footer: {
      statutoryWarning: '⚠️ చట్టబద్ధమైన హెచ్చరిక: మద్యం సేవించడం ఆరోగ్యానికి హానికరం • సురక్షితంగా ఉండండి — తాగి వాహనం నడపకండి',
      statutoryDetails: 'తెలంగాణ ఎక్సైజ్ చట్టం, 1968 నిబంధనల ప్రకారం, 21 సంవత్సరాల కంటే తక్కువ వయస్సు ఉన్న వ్యక్తులకు మద్యం విక్రయించడం ఖచ్చితంగా నిషేధించబడింది. ఈ మార్కెట్‌ప్లేస్ పోర్టల్ లైసెన్స్ పొందిన రిటైలర్ల సమాచార అన్వేషణ కోసం మాత్రమే సాంకేతిక డెమో మోడ్‌లో పనిచేస్తుంది. వాణిజ్య ఆన్‌లైన్ చెల్లింపులు మరియు డెలివరీ పూర్తిగా నిలిపివేయబడ్డాయి.',
      platformTitle: 'Alco',
      platformDesc: 'తెలంగాణలోని లైసెన్స్ పొందిన A4 వైన్ షాపులు మరియు ధృవీకరించబడిన ఉత్పత్తులను కనుగొనడంలో వినియోగదారులకు సహాయపడే ఆధునిక డిజిటల్ కేటలాగ్.',
      failClosed: 'ఫెయిల్-క్లోజ్డ్ చట్టబద్ధ నియంత్రణ విధానం',
      zonesTitle: 'హైదరాబాద్ రిటైల్ ప్రాంతాలు',
      governanceTitle: 'నియంత్రణ & చట్టబద్ధత',
      deptTitle: 'నిషేధం & ఎక్సైజ్ శాఖ',
      govtOfTelangana: 'తెలంగాణ ప్రభుత్వం\nనాంపల్లి, హైదరాబాద్, 500001',
      tollFree: 'టోల్ ఫ్రీ హెల్ప్‌లైన్: 1800-425-2523',
      copyright: 'Alco ప్రోటోటైప్. ప్రదర్శన డేటాసెట్ మాత్రమే.',
      techStack: 'FastAPI, React, PostgreSQL & Tailwind CSS తో రూపొందించబడింది • 21+ నిబంధన చురుకుగా ఉంది'
    }
  }
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('alco_lang') || localStorage.getItem('alcodelivery_lang');
      if (saved === 'en' || saved === 'te') return saved;
    } catch {
      // fallback
    }
    return 'en';
  });

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'te') {
      setLanguageState(lang);
      try {
        localStorage.setItem('alco_lang', lang);
        document.documentElement.lang = lang;
      } catch (e) {
        console.warn('Could not save language preference:', e);
      }
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'te' : 'en');
  };

  // Helper for UI keys
  const t = (key, fallback = '') => {
    if (!key) return '';
    const keys = key.split('.');
    let result = translations[language];
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        result = null;
        break;
      }
    }
    if (result !== null && result !== undefined && typeof result === 'string') {
      return result;
    }
    let fallbackResult = translations['en'];
    for (const k of keys) {
      if (fallbackResult && typeof fallbackResult === 'object' && k in fallbackResult) {
        fallbackResult = fallbackResult[k];
      } else {
        fallbackResult = null;
        break;
      }
    }
    if (fallbackResult !== null && fallbackResult !== undefined && typeof fallbackResult === 'string') {
      return fallbackResult;
    }
    return fallback || key;
  };

  // Helper: Product Name
  const tp = (name) => {
    if (!name || language === 'en') return name;
    if (PRODUCT_TRANSLATIONS[name]) return PRODUCT_TRANSLATIONS[name];
    // Dynamic transliteration fallback for unknown products
    let translated = name;
    for (const [enWord, teWord] of Object.entries(COMMON_WORDS_MAP)) {
      translated = translated.replace(new RegExp(`\\b${enWord}\\b`, 'gi'), teWord);
    }
    return translated;
  };

  // Helper: Brand Name
  const tb = (brand) => {
    if (!brand || language === 'en') return brand;
    return BRAND_TRANSLATIONS[brand] || brand;
  };

  // Helper: Category Name
  const tc = (category) => {
    if (!category || language === 'en') return category;
    return CATEGORY_TRANSLATIONS[category] || category;
  };

  // Helper: Bottle Size
  const ts = (size) => {
    if (!size || language === 'en') return size;
    return SIZE_TRANSLATIONS[size] || size;
  };

  // Helper: Retailer / Shop Name
  const tr = (shop) => {
    if (!shop || language === 'en') return shop;
    return RETAILER_TRANSLATIONS[shop] || shop;
  };

  // Helper: Country of Origin
  const to = (country) => {
    if (!country || language === 'en') return country;
    return COUNTRY_TRANSLATIONS[country] || country;
  };

  // Helper: Order Status Label
  const tstatus = (status) => {
    if (!status) return '';
    const s = String(status).toLowerCase();
    if (language === 'te') {
      const STATUS_TE = {
        created: 'ఆర్డర్ చేయబడింది',
        confirmed: 'రిటైలర్ ధృవీకరించారు',
        preparing: 'ప్యాకింగ్ జరుగుతోంది',
        ready: 'షాపు వద్ద సిద్ధంగా ఉంది',
        completed: 'పూర్తయింది (సిమ్యులేటెడ్)',
        cancelled: 'రద్దు చేయబడింది'
      };
      return STATUS_TE[s] || status;
    }
    const STATUS_EN = {
      created: 'Order Placed',
      confirmed: 'Retailer Confirmed',
      preparing: 'Packing & Preparing',
      ready: 'Ready for Store Pickup',
      completed: 'Completed (Simulated)',
      cancelled: 'Cancelled'
    };
    return STATUS_EN[s] || status;
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch {
      // ignore
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, tp, tb, tc, ts, tr, to, tstatus }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
