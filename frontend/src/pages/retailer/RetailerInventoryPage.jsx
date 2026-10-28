import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Edit2,
  Check,
  X,
  ArrowLeft,
  Search,
  Filter,
  RotateCcw,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Trash2,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info,
  RefreshCw,
  Boxes,
  Download,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function RetailerInventoryPage() {
  const { t, tc, language } = useLanguage();
  const [searchParams] = useSearchParams();

  // Data states
  const [data, setData] = useState({
    items: [],
    total: 0,
    page: 1,
    page_size: 20,
    total_pages: 1,
    summary: {
      total_listings: 0,
      in_stock_listings: 0,
      low_stock_listings: 0,
      out_of_stock_listings: 0,
      total_units: 0,
      inactive_listings: 0
    }
  });
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [masterBrands, setMasterBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Pagination state (initialize stock status from URL if present)
  const initialStockStatus = useMemo(() => {
    const s = searchParams.get('stock');
    if (s === 'low' || s === 'low_stock') return 'low_stock';
    if (s === 'out' || s === 'out_of_stock') return 'out_of_stock';
    if (s === 'in' || s === 'in_stock') return 'in_stock';
    return 'all';
  }, [searchParams]);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [stockStatus, setStockStatus] = useState(initialStockStatus);
  const [listingStatus, setListingStatus] = useState('all');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // In-app Notifications Toast state
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load Catalogue Master Data once
  useEffect(() => {
    async function loadMasterCatalogue() {
      try {
        const [prodRes, catRes, brandsRes] = await Promise.allSettled([
          api.getProducts({ limit: 100 }),
          api.getCategories(),
          api.getBrands()
        ]);
        if (prodRes.status === 'fulfilled') {
          setCatalogProducts(prodRes.value?.items || []);
        }
        if (catRes.status === 'fulfilled') {
          setCategories(catRes.value || []);
        }
        if (brandsRes.status === 'fulfilled') {
          setMasterBrands(brandsRes.value || []);
        }
      } catch (err) {
        console.error('Failed to load catalogue products:', err);
      }
    }
    loadMasterCatalogue();
  }, []);

  // Fetch paginated inventory
  const fetchInventory = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params = {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedBrand) params.brand = selectedBrand;
      if (stockStatus && stockStatus !== 'all') params.stock_status = stockStatus;
      if (listingStatus && listingStatus !== 'all') params.listing_status = listingStatus;

      const res = await api.getRetailerInventory(params);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, pageSize, sortBy, sortOrder, debouncedSearch, selectedCategory, selectedBrand, stockStatus, listingStatus]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Distinct Brands from Catalogue, Brands API, and inventory for brand filter
  const availableBrands = useMemo(() => {
    const brands = new Set(masterBrands || []);
    catalogProducts.forEach((p) => {
      if (p.brand) brands.add(p.brand);
    });
    (data.items || []).forEach((item) => {
      if (item.brand) brands.add(item.brand);
      if (item.product?.brand) brands.add(item.product.brand);
      if (item.product_brand) brands.add(item.product_brand);
    });
    return Array.from(brands).filter(Boolean).sort();
  }, [masterBrands, catalogProducts, data.items]);

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    debouncedSearch || selectedCategory || selectedBrand || (stockStatus && stockStatus !== 'all') || (listingStatus && listingStatus !== 'all')
  );

  const clearAllFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setStockStatus('all');
    setListingStatus('all');
    setPage(1);
  };

  // ==========================================
  // Inline Row Editing State
  // ==========================================
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editThreshold, setEditThreshold] = useState('5');
  const [editAvailable, setEditAvailable] = useState(true);
  const [editErrors, setEditErrors] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditPrice(item.price.toString());
    setEditStock(item.stock_quantity.toString());
    setEditThreshold((item.low_stock_threshold ?? 5).toString());
    setEditAvailable(item.is_available);
    setEditErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditErrors({});
  };

  const handleSaveEdit = async (item) => {
    const errors = {};
    const pVal = parseFloat(editPrice);
    const sVal = parseInt(editStock, 10);
    const tVal = parseInt(editThreshold, 10);

    if (isNaN(pVal) || pVal <= 0) errors.price = 'Price must be greater than 0';
    if (isNaN(sVal) || sVal < 0) errors.stock = 'Stock quantity cannot be negative';
    if (isNaN(tVal) || tVal < 0) errors.threshold = 'Threshold cannot be negative';

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    try {
      setSavingEdit(true);
      await api.updateInventoryItem(item.id, {
        price: pVal,
        stock_quantity: sVal,
        low_stock_threshold: tVal,
        is_available: editAvailable,
        expected_version: item.version
      });
      addToast(language === 'te' ? 'ఉత్పత్తి విజయవంతంగా నవీకరించబడింది' : 'Inventory item updated successfully', 'success');
      setEditingId(null);
      fetchInventory(true);
    } catch (err) {
      if (err.status === 409) {
        addToast(
          language === 'te'
            ? 'ఈ అంశం మరొక అభ్యర్థన ద్వారా మార్చబడింది. తాజా డేటాను లోడ్ చేస్తోంది.'
            : 'Concurrency conflict: item was updated by another request. Reloading fresh data.',
          'error'
        );
        fetchInventory(true);
      } else {
        addToast(err.message || 'Failed to update item', 'error');
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // Quick Toggle Availability
  const handleToggleAvailability = async (item) => {
    try {
      await api.updateInventoryItem(item.id, {
        is_available: !item.is_available,
        expected_version: item.version
      });
      addToast(
        !item.is_available
          ? (language === 'te' ? 'ఉత్పత్తి సక్రియం చేయబడింది' : 'Listing marked as active')
          : (language === 'te' ? 'ఉత్పత్తి నిష్క్రియం చేయబడింది' : 'Listing deactivated from shop'),
        'info'
      );
      fetchInventory(true);
    } catch (err) {
      addToast(err.message || 'Failed to toggle availability', 'error');
    }
  };

  // ==========================================
  // Stock Adjustment Dialog State
  // ==========================================
  const [adjustItem, setAdjustItem] = useState(null);
  const [newAdjustQty, setNewAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('restock');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  const openStockAdjustment = (item) => {
    setAdjustItem(item);
    setNewAdjustQty(item.stock_quantity.toString());
    setAdjustReason('restock');
    setAdjustNotes('');
    setAdjustError('');
  };

  const handleStockAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustItem) return;

    const parsedQty = parseInt(newAdjustQty, 10);
    if (isNaN(parsedQty) || parsedQty < 0) {
      setAdjustError('New stock quantity cannot be negative.');
      return;
    }

    try {
      setSubmittingAdjust(true);
      setAdjustError('');
      await api.adjustInventoryStock(adjustItem.id, {
        new_quantity: parsedQty,
        reason: adjustReason,
        notes: adjustNotes || undefined,
        expected_version: adjustItem.version
      });
      addToast(
        language === 'te'
          ? `స్టాక్ సర్దుబాటు రికార్డ్ చేయబడింది (${adjustItem.stock_quantity} -> ${parsedQty})`
          : `Stock adjusted successfully (${adjustItem.stock_quantity} -> ${parsedQty})`,
        'success'
      );
      setAdjustItem(null);
      fetchInventory(true);
    } catch (err) {
      if (err.status === 409) {
        setAdjustError('Concurrency conflict: stock was updated by another request. Please reload and retry.');
        fetchInventory(true);
      } else {
        setAdjustError(err.message || 'Failed to adjust stock');
      }
    } finally {
      setSubmittingAdjust(false);
    }
  };

  // ==========================================
  // Inventory Movement History Modal State
  // ==========================================
  const [historyItem, setHistoryItem] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const openHistoryModal = async (item) => {
    setHistoryItem(item);
    setLoadingHistory(true);
    setMovements([]);
    try {
      const records = await api.getInventoryMovements(item.id);
      setMovements(records || []);
    } catch (err) {
      addToast(err.message || 'Failed to load stock movement history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  // ==========================================
  // Add Product SKU Modal State
  // ==========================================
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [newProductId, setNewProductId] = useState('');
  const [newBottleSize, setNewBottleSize] = useState('750ml');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('10');
  const [newThreshold, setNewThreshold] = useState('5');
  const [addFormErrors, setAddFormErrors] = useState({});
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Selected catalog product preview
  const selectedCatalogProd = useMemo(() => {
    return catalogProducts.find((p) => p.id === newProductId) || catalogProducts[0];
  }, [catalogProducts, newProductId]);

  const filteredModalProducts = useMemo(() => {
    if (!modalSearch) return catalogProducts;
    const term = modalSearch.toLowerCase();
    return catalogProducts.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.brand?.toLowerCase().includes(term) ||
        p.category_name?.toLowerCase().includes(term)
    );
  }, [catalogProducts, modalSearch]);

  const openAddModal = () => {
    if (catalogProducts.length > 0 && !newProductId) {
      setNewProductId(catalogProducts[0].id);
    }
    setModalSearch('');
    setNewBottleSize('750ml');
    setNewPrice('');
    setNewStock('10');
    setNewThreshold('5');
    setAddFormErrors({});
    setShowAddModal(true);
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setAddFormErrors({});

    const errors = {};
    const pVal = parseFloat(newPrice);
    const sVal = parseInt(newStock, 10);
    const tVal = parseInt(newThreshold, 10);

    if (!newProductId) errors.productId = 'Please select a catalog product';
    if (!newBottleSize) errors.bottleSize = 'Please select a bottle size';
    if (isNaN(pVal) || pVal <= 0) errors.price = 'Price must be greater than 0';
    if (isNaN(sVal) || sVal < 0) errors.stock = 'Initial stock cannot be negative';
    if (isNaN(tVal) || tVal < 0) errors.threshold = 'Threshold cannot be negative';

    if (Object.keys(errors).length > 0) {
      setAddFormErrors(errors);
      return;
    }

    try {
      setSubmittingAdd(true);
      await api.createInventoryItem({
        product_id: newProductId,
        bottle_size: newBottleSize,
        price: pVal,
        stock_quantity: sVal,
        low_stock_threshold: tVal,
        is_available: true
      });
      addToast(
        language === 'te'
          ? 'తెలంగాణ కేటలాగ్ నుండి ఉత్పత్తి షాపు ఇన్వెంటరీకి జోడించబడింది!'
          : 'Product SKU published to shop inventory successfully!',
        'success'
      );
      setShowAddModal(false);
      fetchInventory(true);
    } catch (err) {
      if (err.status === 409) {
        setAddFormErrors({
          duplicate: 'This product and bottle size combination is already listed in your inventory.'
        });
      } else {
        setAddFormErrors({ general: err.message || 'Failed to add product listing' });
      }
    } finally {
      setSubmittingAdd(false);
    }
  };

  // ==========================================
  // Deactivate / Delete Confirmation Modal
  // ==========================================
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDeactivation = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      const res = await api.deleteInventoryItem(itemToDelete.id);
      if (res.action === 'deactivated') {
        addToast(
          language === 'te'
            ? 'ఈ వస్తువుకు ఆర్డర్ల చరిత్ర ఉన్నందున ఆడిట్ నిబంధనల ప్రకారం ఇది నిష్క్రియం చేయబడింది.'
            : 'Preserved order audit history: listing has been deactivated instead of deleted.',
          'info'
        );
      } else {
        addToast(
          language === 'te' ? 'జాబితా తొలగించబడింది.' : 'Inventory listing removed.',
          'success'
        );
      }
      setItemToDelete(null);
      fetchInventory(true);
    } catch (err) {
      addToast(err.message || 'Failed to remove listing', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // Feature D: Bulk Inventory CSV Import/Export
  // ==========================================
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [applyingImport, setApplyingImport] = useState(false);

  const handleExportCsv = async () => {
    try {
      const csvData = await api.exportInventoryCsv();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast(
        language === 'te'
          ? 'ఇన్వెంటరీ CSV విజయవంతంగా డౌన్‌లోడ్ చేయబడింది!'
          : 'Inventory CSV exported successfully!',
        'success'
      );
    } catch (err) {
      addToast(err.message || 'Failed to export inventory CSV', 'error');
    }
  };

  const handleCsvFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || '';
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handlePreviewCsv = async () => {
    if (!csvText.trim()) {
      addToast(
        language === 'te'
          ? 'దయచేసి ప్రివ్యూ చేయడానికి CSV ఫైల్‌ను అప్‌లోడ్ చేయండి లేదా టెక్స్ట్‌ను అతికించండి.'
          : 'Please upload or paste CSV text to preview.',
        'info'
      );
      return;
    }
    try {
      setPreviewLoading(true);
      const res = await api.previewInventoryImport(csvText);
      setImportPreview(res);
    } catch (err) {
      addToast(err.message || 'Failed to preview CSV import', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApplyImport = async () => {
    if (!importPreview || !importPreview.items) return;
    const validItems = importPreview.items
      .filter((item) => item.is_valid && item.action !== 'error')
      .map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        bottle_size: item.bottle_size,
        price: item.price,
        stock_quantity: item.stock_quantity,
        low_stock_threshold: item.low_stock_threshold,
        is_available: item.is_available,
      }));

    if (validItems.length === 0) {
      addToast('No valid rows available to apply.', 'error');
      return;
    }

    try {
      setApplyingImport(true);
      const res = await api.applyInventoryImport(validItems);
      addToast(
        language === 'te'
          ? `బల్క్ దిగుమతి పూర్తయింది: ${res.created_count} కొత్తవి, ${res.updated_count} నవీకరించబడ్డాయి!`
          : `Bulk import applied: ${res.created_count} created, ${res.updated_count} updated!`,
        'success'
      );
      setShowBulkModal(false);
      setImportPreview(null);
      setCsvText('');
      setCsvFile(null);
      fetchInventory(true);
    } catch (err) {
      addToast(err.message || 'Failed to apply inventory import', 'error');
    } finally {
      setApplyingImport(false);
    }
  };

  // Active Menu Dropdown state for rows
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Close row menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const summary = data.summary || {
    total_listings: 0,
    in_stock_listings: 0,
    low_stock_listings: 0,
    out_of_stock_listings: 0,
    total_units: 0
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 transition-colors duration-200">
      
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border text-xs animate-in slide-in-from-top duration-200 ${
              toast.type === 'error'
                ? 'bg-rose-950/95 text-rose-200 border-rose-800'
                : toast.type === 'info'
                ? 'bg-amber-950/95 text-amber-200 border-amber-800'
                : 'bg-emerald-950/95 text-emerald-200 border-emerald-800'
            }`}
          >
            {toast.type === 'error' ? (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <p className="flex-1 font-medium leading-relaxed">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-white shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <Link
            to="/retailer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {language === 'te' ? 'రిటైలర్ డాష్‌బోర్డ్‌కు తిరిగి వెళ్లండి' : 'Back to Retailer Dashboard'}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              {t('inventory.title')}
            </h1>
            <button
              onClick={() => fetchInventory(true)}
              disabled={refreshing}
              title="Refresh inventory"
              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {language === 'te'
              ? 'తెలంగాణ ఎక్సైజ్ నిబంధనల ప్రకారం MRP మరియు స్టాక్ స్థాయిలను నిర్వహించండి'
              : 'Manage stock quantities, MRP validation, and availability under Telangana Excise rules'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="py-2 px-3.5 rounded-xl text-xs font-bold bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Download complete shop inventory in CSV format"
          >
            <Download className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setShowBulkModal(true);
              setImportPreview(null);
            }}
            className="py-2 px-3.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Upload CSV to update prices and stock quantities"
          >
            <Upload className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>Import Bulk CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t('inventory.addBtn')}
          </button>
        </div>
      </div>

      {/* 1. Inventory Summary Cards (Clickable & dynamically bound to filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Listings */}
        <button
          onClick={() => {
            setStockStatus('all');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            stockStatus === 'all'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
          }`}
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {language === 'te' ? 'మొత్తం లిస్టింగ్‌లు' : 'Total Listings'}
            </span>
            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100">
            {summary.total_listings}
          </div>
          <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">
            {language === 'te' ? 'అన్ని కేటలాగ్ SKUs' : 'All SKUs in shop'}
          </span>
        </button>

        {/* In-Stock Listings */}
        <button
          onClick={() => {
            setStockStatus('in_stock');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            stockStatus === 'in_stock'
              ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
          }`}
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              {language === 'te' ? 'స్టాక్‌లో ఉన్నవి' : 'In Stock'}
            </span>
            <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {summary.in_stock_listings}
          </div>
          <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">
            {language === 'te' ? 'కస్టమర్లకు లభ్యం' : 'Available for ordering'}
          </span>
        </button>

        {/* Low-Stock Listings */}
        <button
          onClick={() => {
            setStockStatus('low_stock');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            stockStatus === 'low_stock'
              ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
          }`}
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              {language === 'te' ? 'తక్కువ స్టాక్' : 'Low Stock'}
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400">
            {summary.low_stock_listings}
          </div>
          <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">
            {language === 'te' ? 'పరిమితి కంటే తక్కువ' : '≤ Threshold limit'}
          </span>
        </button>

        {/* Out-of-Stock Listings */}
        <button
          onClick={() => {
            setStockStatus('out_of_stock');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
            stockStatus === 'out_of_stock'
              ? 'bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/30'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
          }`}
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400">
              {language === 'te' ? 'స్టాక్ ముగిసింది' : 'Out of Stock'}
            </span>
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400">
            {summary.out_of_stock_listings}
          </div>
          <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">
            {language === 'te' ? '0 యూనిట్లు మిగిలాయి' : '0 units available'}
          </span>
        </button>

        {/* Total Physical Units */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {language === 'te' ? 'మొత్తం యూనిట్లు' : 'Total Units'}
            </span>
            <Boxes className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100">
            {summary.total_units?.toLocaleString('en-IN') || 0}
          </div>
          <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">
            {language === 'te' ? 'గోదాము/షాపులో బాటిల్స్' : 'Bottles in inventory'}
          </span>
        </div>
      </div>

      {/* 2. Search, Filters, and Sorting Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('inventory.searchPlaceholder') || 'Search product, brand, size...'}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">{language === 'te' ? 'అన్ని వర్గాలు (Categories)' : 'All Categories'}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {tc ? tc(c.name) : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">{language === 'te' ? 'అన్ని బ్రాండ్లు (Brands)' : 'All Brands'}</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Listing Status Filter */}
          <div>
            <select
              value={listingStatus}
              onChange={(e) => {
                setListingStatus(e.target.value);
                setPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">{language === 'te' ? 'అన్ని లిస్టింగ్స్' : 'All Listing Statuses'}</option>
              <option value="active">{language === 'te' ? 'సక్రియం మాత్రమే (Active)' : 'Active in Shop'}</option>
              <option value="inactive">{language === 'te' ? 'నిష్క్రియం మాత్రమే (Inactive)' : 'Inactive / Hidden'}</option>
            </select>
          </div>

        </div>

        {/* Sort & Filter controls footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
            <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="font-semibold">
              {language === 'te' ? 'క్రమబద్ధీకరించు:' : 'Sort By:'}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-stone-800 dark:text-stone-200 outline-none cursor-pointer"
            >
              <option value="updated_at">{language === 'te' ? 'చివరిగా నవీకరించబడినది' : 'Last Updated'}</option>
              <option value="name">{language === 'te' ? 'ఉత్పత్తి పేరు' : 'Product Name'}</option>
              <option value="price">{language === 'te' ? 'ధర / MRP' : 'Price / MRP'}</option>
              <option value="stock_quantity">{language === 'te' ? 'స్టాక్ పరిమాణం' : 'Stock Quantity'}</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 rounded text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 font-bold transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                {language === 'te' ? 'ఫిల్టర్లు క్లియర్ చేయండి' : 'Clear Filters'}
              </button>
            )}

            <div className="text-stone-400 dark:text-stone-500 text-[11px] font-medium">
              {language === 'te'
                ? `మొత్తం ${data.total} లో ${data.items?.length || 0} అంశాలు ప్రదర్శించబడుతున్నాయి`
                : `Showing ${data.items?.length || 0} of ${data.total} listings`}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Inventory Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-400 font-medium">
              {language === 'te' ? 'షాపు ఇన్వెంటరీ లోడ్ అవుతోంది...' : 'Loading verified shop inventory...'}
            </p>
          </div>
        ) : error ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/80 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                {language === 'te' ? 'ఇన్వెంటరీ లోడ్ చేయడం విఫలమైంది' : 'Failed to Load Inventory'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1">{error}</p>
            </div>
            <button
              onClick={() => fetchInventory(true)}
              className="py-2 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow transition cursor-pointer"
            >
              {language === 'te' ? 'మళ్లీ ప్రయత్నించండి' : 'Retry'}
            </button>
          </div>
        ) : data.items.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-14 h-14 bg-stone-100 dark:bg-stone-800 text-stone-400 rounded-2xl flex items-center justify-center mx-auto">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                {hasActiveFilters
                  ? (language === 'te' ? 'ఎలాంటి ఫలితాలు కనుగొనబడలేదు' : 'No listings matched your filters')
                  : t('inventory.noItems')}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1">
                {hasActiveFilters
                  ? (language === 'te' ? 'దయచేసి శోధన పదం లేదా ఫిల్టర్లను మార్చడానికి ప్రయత్నించండి.' : 'Try adjusting your search query, brand, or stock filters.')
                  : (language === 'te'
                    ? 'తెలంగాణ ఆమోదిత కేటలాగ్ నుండి ఉత్పత్తులను ప్రచురించడానికి "కొత్త ఉత్పత్తిని జోడించండి" క్లిక్ చేయండి.'
                    : 'Click "Add Product Listing" above to publish products from the approved Telangana catalogue.')}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
              >
                {language === 'te' ? 'అన్ని ఫిల్టర్లను తీసివేయండి' : 'Reset all filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t('inventory.thProduct')}</th>
                  <th className="py-3 px-4">{t('inventory.thSize')}</th>
                  <th className="py-3 px-4">{t('inventory.thPrice')}</th>
                  <th className="py-3 px-4">{t('inventory.thStock')}</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">{t('inventory.thStatus')}</th>
                  <th className="py-3 px-4 text-right">{t('inventory.thActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {data.items.map((item) => {
                  const isEditing = editingId === item.id;
                  const isLowStock = item.is_available && item.stock_quantity > 0 && item.stock_quantity <= item.low_stock_threshold;
                  const isOutOfStock = item.stock_quantity === 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-stone-50/80 dark:hover:bg-stone-800/50 transition group"
                    >
                      {/* Product Name & Brand */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.product_name}
                              className="w-9 h-9 rounded-lg object-contain bg-stone-100 dark:bg-stone-800 p-1 border border-stone-200 dark:border-stone-700 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-stone-800 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-700 font-black text-xs">
                              {item.product_name?.[0] || 'A'}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-stone-900 dark:text-stone-100 block">
                              {item.product_name || 'Approved Product'}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-amber-800 dark:text-amber-400 font-semibold uppercase">
                                {item.brand || 'Spirits'}
                              </span>
                              <span className="text-stone-400">•</span>
                              <span className="text-stone-500 dark:text-stone-400">
                                {item.category_name || 'Beverage'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Bottle Size */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-stone-700 dark:text-stone-300">
                        <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-[11px] border border-stone-200 dark:border-stone-700">
                          {item.bottle_size}
                        </span>
                      </td>

                      {/* Price / MRP */}
                      <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                        {isEditing ? (
                          <div>
                            <input
                              type="number"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-24 p-1.5 border rounded-lg text-xs font-bold bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            {editErrors.price && (
                              <span className="block text-[10px] text-rose-500 mt-0.5">{editErrors.price}</span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span>₹{Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            {item.mrp && Number(item.price) < Number(item.mrp) && (
                              <span className="block text-[10px] text-stone-400 line-through">
                                ₹{Number(item.mrp).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Stock Units */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <div>
                            <input
                              type="number"
                              value={editStock}
                              onChange={(e) => setEditStock(e.target.value)}
                              className="w-20 p-1.5 border rounded-lg text-xs bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            {editErrors.stock && (
                              <span className="block text-[10px] text-rose-500 mt-0.5">{editErrors.stock}</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold ${
                                isOutOfStock
                                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                                  : isLowStock
                                  ? 'text-amber-800 dark:text-amber-400 font-bold'
                                  : 'text-stone-800 dark:text-stone-200'
                              }`}
                            >
                              {item.stock_quantity} {language === 'te' ? 'యూనిట్లు' : 'units'}
                            </span>
                            <button
                              onClick={() => openStockAdjustment(item)}
                              title={language === 'te' ? 'స్టాక్ సర్దుబాటు చేయండి' : 'Adjust Stock'}
                              className="opacity-0 group-hover:opacity-100 transition px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950 text-[10px] font-bold text-amber-800 dark:text-amber-400 border border-stone-200 dark:border-stone-700 cursor-pointer"
                            >
                              +/-
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Low Stock Threshold */}
                      <td className="py-3.5 px-4 text-stone-500 dark:text-stone-400 font-mono">
                        {isEditing ? (
                          <div>
                            <input
                              type="number"
                              value={editThreshold}
                              onChange={(e) => setEditThreshold(e.target.value)}
                              className="w-16 p-1.5 border rounded-lg text-xs bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 outline-none"
                            />
                            {editErrors.threshold && (
                              <span className="block text-[10px] text-rose-500 mt-0.5">{editErrors.threshold}</span>
                            )}
                          </div>
                        ) : (
                          <span>≤ {item.low_stock_threshold ?? 5}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-stone-700 dark:text-stone-300">
                            <input
                              type="checkbox"
                              checked={editAvailable}
                              onChange={(e) => setEditAvailable(e.target.checked)}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span>{language === 'te' ? 'షాపులో సక్రియం' : 'Active in shop'}</span>
                          </label>
                        ) : (
                          <div className="flex flex-col gap-1 items-start">
                            {!item.is_available ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
                                {language === 'te' ? 'నిష్క్రియం' : 'Inactive'}
                              </span>
                            ) : isOutOfStock ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                {t('inventory.outOfStock')}
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                {language === 'te' ? 'తక్కువ స్టాక్' : 'Low Stock'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                {t('inventory.inStock')}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(item)}
                              disabled={savingEdit}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow transition cursor-pointer"
                              title={t('inventory.save')}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 rounded-lg transition cursor-pointer"
                              title={t('inventory.cancel')}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === item.id && (
                              <div className="absolute right-0 mt-1 w-44 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl py-1 z-30 text-xs animate-in fade-in duration-150">
                                <button
                                  onClick={() => {
                                    startEdit(item);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 text-stone-700 dark:text-stone-200 cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-stone-400" />
                                  <span>{language === 'te' ? 'త్వరిత సవరణ' : 'Quick Edit'}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    openStockAdjustment(item);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 text-stone-700 dark:text-stone-200 cursor-pointer"
                                >
                                  <Package className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                  <span>{language === 'te' ? 'స్టాక్ సర్దుబాటు' : 'Adjust Stock'}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    openHistoryModal(item);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 text-stone-700 dark:text-stone-200 cursor-pointer"
                                >
                                  <History className="w-3.5 h-3.5 text-blue-500" />
                                  <span>{language === 'te' ? 'చరిత్రను వీక్షించండి' : 'Stock History'}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    handleToggleAvailability(item);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 text-stone-700 dark:text-stone-200 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>
                                    {item.is_available
                                      ? (language === 'te' ? 'నిష్క్రియం చేయండి' : 'Deactivate')
                                      : (language === 'te' ? 'సక్రియం చేయండి' : 'Activate')}
                                  </span>
                                </button>

                                <div className="border-t border-stone-100 dark:border-stone-800 my-1" />

                                <button
                                  onClick={() => {
                                    setItemToDelete(item);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{language === 'te' ? 'జాబితాను తొలగించు' : 'Remove Listing'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {data.total_pages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-stone-100 dark:border-stone-800 text-xs">
            <div className="text-stone-500 dark:text-stone-400">
              {language === 'te'
                ? `పేజీ ${data.page} / ${data.total_pages} (మొత్తం ${data.total} SKUs)`
                : `Page ${data.page} of ${data.total_pages} (${data.total} total items)`}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="py-1 px-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 outline-none"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>

              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
                className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-100 dark:hover:bg-stone-800 transition text-stone-700 dark:text-stone-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={data.page >= data.total_pages}
                className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-100 dark:hover:bg-stone-800 transition text-stone-700 dark:text-stone-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          Stock Adjustment Dialog Modal
      ========================================== */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                  {language === 'te' ? 'స్టాక్ పరిమాణాన్ని సర్దుబాటు చేయండి' : 'Adjust Stock Quantity'}
                </h3>
                <span className="text-[11px] text-stone-400">
                  {adjustItem.product_name} ({adjustItem.bottle_size})
                </span>
              </div>
              <button
                onClick={() => setAdjustItem(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold">
                    {language === 'te' ? 'ప్రస్తుత స్టాక్' : 'Current Stock'}
                  </span>
                  <span className="text-xl font-black text-stone-900 dark:text-stone-100">
                    {adjustItem.stock_quantity} units
                  </span>
                </div>
                {newAdjustQty !== '' && !isNaN(parseInt(newAdjustQty, 10)) && (
                  <div className="text-right">
                    <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold">
                      {language === 'te' ? 'వ్యత్యాసం' : 'Net Change'}
                    </span>
                    {parseInt(newAdjustQty, 10) - adjustItem.stock_quantity > 0 ? (
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 justify-end">
                        <TrendingUp className="w-3.5 h-3.5" /> +
                        {parseInt(newAdjustQty, 10) - adjustItem.stock_quantity}
                      </span>
                    ) : parseInt(newAdjustQty, 10) - adjustItem.stock_quantity < 0 ? (
                      <span className="text-sm font-black text-rose-600 dark:text-rose-400 flex items-center gap-0.5 justify-end">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {parseInt(newAdjustQty, 10) - adjustItem.stock_quantity}
                      </span>
                    ) : (
                      <span className="text-sm font-black text-stone-400">0</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  {language === 'te' ? 'కొత్త భౌతిక స్టాక్ పరిమాణం' : 'New Physical Stock Count'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={newAdjustQty}
                  onChange={(e) => setNewAdjustQty(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  {language === 'te' ? 'సర్దుబాటుకు కారణం (Audit Reason)' : 'Adjustment Reason (Regulatory Audit)'}
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none"
                  required
                >
                  <option value="restock">{language === 'te' ? 'కొత్త డెలివరీ / రీస్టాక్' : 'Restock / New Shipment Received'}</option>
                  <option value="damage">{language === 'te' ? 'డ్యామేజ్ / బ్రేకేజ్' : 'Transit Damage / Breakage'}</option>
                  <option value="correction">{language === 'te' ? 'ఇన్వెంటరీ సరిదిద్దడం' : 'Physical Count Correction'}</option>
                  <option value="theft_loss">{language === 'te' ? 'నష్టం / లీకేజ్' : 'Spillage / Verified Loss'}</option>
                  <option value="audit_reconciliation">{language === 'te' ? 'ఎక్సైజ్ ఆడిట్ సరిపోలిక' : 'Excise Audit Reconciliation'}</option>
                  <option value="demo_return">{language === 'te' ? 'డెమో రిటర్న్' : 'Customer Return (Simulated)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  {language === 'te' ? 'గమనికలు / రిఫరెన్స్ (ఐచ్ఛికం)' : 'Audit Notes / Invoice Ref (Optional)'}
                </label>
                <textarea
                  rows="2"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder={language === 'te' ? 'ఉదా. ఇన్వాయిస్ #TS-2024-9988' : 'e.g. Invoice #TS-EXC-4091 or shelf count reconciliation'}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none resize-none"
                />
              </div>

              {adjustError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{adjustError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="py-2.5 px-4 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold cursor-pointer"
                >
                  {t('inventory.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold shadow transition cursor-pointer"
                >
                  {submittingAdjust ? 'Recording...' : (language === 'te' ? 'సర్దుబాటు నిర్ధారించండి' : 'Confirm Stock Adjustment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          Movement History Modal
      ========================================== */}
      {historyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="max-w-2xl w-full bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                    {language === 'te' ? 'స్టాక్ మూవ్మెంట్ ఆడిట్ చరిత్ర' : 'Stock Movement Audit History'}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    {historyItem.product_name} • {historyItem.bottle_size} (Current: {historyItem.stock_quantity} units)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryItem(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {loadingHistory ? (
                <div className="py-12 text-center text-stone-400">
                  <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading movement logs...
                </div>
              ) : movements.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <Info className="w-8 h-8 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
                  {language === 'te'
                    ? 'ఈ ఉత్పత్తి కోసం ఎలాంటి స్టాక్ మార్పు రికార్డులు లేవు.'
                    : 'No stock adjustments recorded yet for this SKU.'}
                </div>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-stone-800 border border-stone-100 dark:border-stone-800 rounded-2xl overflow-hidden">
                  {movements.map((m) => (
                    <div key={m.id} className="p-3.5 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              m.change_quantity > 0
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                : m.change_quantity < 0
                                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                            }`}
                          >
                            {m.change_quantity > 0 ? `+${m.change_quantity}` : m.change_quantity} units
                          </span>
                          <span className="font-bold text-stone-800 dark:text-stone-200 uppercase text-[11px]">
                            {m.reason.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <span className="text-[10px] text-stone-400 font-mono">
                          {new Date(m.created_at).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                        <span>
                          {m.previous_quantity} units → <strong className="text-stone-800 dark:text-stone-200">{m.new_quantity} units</strong>
                        </span>
                        <span>
                          By: <span className="font-semibold text-stone-700 dark:text-stone-300">{m.actor_name}</span> ({m.actor_role})
                        </span>
                      </div>

                      {m.notes && (
                        <p className="mt-1 text-[11px] text-stone-600 dark:text-stone-400 italic bg-stone-50 dark:bg-stone-800/60 p-1.5 rounded-lg">
                          "{m.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-right shrink-0">
              <button
                onClick={() => setHistoryItem(null)}
                className="py-2 px-5 rounded-xl text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          4. Add Product SKU Modal (With master catalogue selection & validation)
      ========================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="max-w-lg w-full bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 shrink-0">
              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                  {language === 'te' ? 'షాపుకు కేటలాగ్ ఉత్పత్తిని జోడించండి' : 'Publish Catalogue Product to Shop'}
                </h3>
                <p className="text-[11px] text-stone-400">
                  {language === 'te'
                    ? 'తెలంగాణ స్టేట్ ఆమోదిత ఆల్కహాల్ కేటలాగ్ నుండి ఎంచుకోండి'
                    : 'Select from official approved Telangana excise liquor catalogue'}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
              
              {/* Filter catalogue products */}
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  {language === 'te' ? 'కేటలాగ్ నుండి శోధించండి' : '1. Search Approved Catalogue'}
                </label>
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="Search brand (e.g. Amrut, Paul John, Glenfiddich)..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                <select
                  value={newProductId}
                  onChange={(e) => setNewProductId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 outline-none bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  required
                >
                  {filteredModalProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.brand} ({p.category_name})
                    </option>
                  ))}
                </select>
                {addFormErrors.productId && (
                  <span className="block text-rose-500 mt-1 font-medium">{addFormErrors.productId}</span>
                )}
              </div>

              {/* Selected Product Master Details Preview */}
              {selectedCatalogProd && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                  {selectedCatalogProd.image_url ? (
                    <img
                      src={selectedCatalogProd.image_url}
                      alt={selectedCatalogProd.name}
                      className="w-12 h-12 rounded-xl object-contain bg-white dark:bg-stone-800 p-1 border border-amber-200 dark:border-amber-900 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                      {selectedCatalogProd.name?.[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <span className="font-extrabold text-stone-900 dark:text-stone-100 block">
                      {selectedCatalogProd.name}
                    </span>
                    <span className="text-[10px] text-amber-800 dark:text-amber-400 font-bold uppercase">
                      {selectedCatalogProd.brand} • {selectedCatalogProd.category_name}
                    </span>
                    {selectedCatalogProd.description && (
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                        {selectedCatalogProd.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Bottle Size Selector */}
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  {t('inventory.thSize')}
                </label>
                <select
                  value={newBottleSize}
                  onChange={(e) => setNewBottleSize(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 outline-none bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono font-semibold"
                >
                  <option value="750ml">750ml (Full Bottle)</option>
                  <option value="375ml">375ml (Half Bottle)</option>
                  <option value="180ml">180ml (Quarter)</option>
                  <option value="650ml">650ml (Standard Beer Bottle)</option>
                  <option value="500ml">500ml (Pint / Can)</option>
                  <option value="330ml">330ml (Can / Pint)</option>
                  <option value="1000ml">1000ml (1 Litre Commercial)</option>
                </select>
                {addFormErrors.bottleSize && (
                  <span className="block text-rose-500 mt-1 font-medium">{addFormErrors.bottleSize}</span>
                )}
              </div>

              {/* Price & Stock & Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    {t('inventory.thPrice')} (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. 2400.00"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 outline-none bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold"
                    required
                  />
                  {addFormErrors.price && (
                    <span className="block text-rose-500 mt-1 font-medium">{addFormErrors.price}</span>
                  )}
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    {t('inventory.thStock')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="10"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 outline-none bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold"
                    required
                  />
                  {addFormErrors.stock && (
                    <span className="block text-rose-500 mt-1 font-medium">{addFormErrors.stock}</span>
                  )}
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(e.target.value)}
                    placeholder="5"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 outline-none bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold"
                    required
                  />
                  {addFormErrors.threshold && (
                    <span className="block text-rose-500 mt-1 font-medium">{addFormErrors.threshold}</span>
                  )}
                </div>
              </div>

              {addFormErrors.duplicate && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{addFormErrors.duplicate}</span>
                </div>
              )}

              {addFormErrors.general && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl">
                  {addFormErrors.general}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100 dark:border-stone-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold cursor-pointer"
                >
                  {t('inventory.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold shadow transition cursor-pointer"
                >
                  {submittingAdd ? 'Publishing...' : t('inventory.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          Deactivate / Delete Confirmation Dialog
      ========================================== */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                  {language === 'te' ? 'జాబితాను తీసివేయాలా?' : 'Remove Inventory Listing?'}
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {itemToDelete.product_name} ({itemToDelete.bottle_size})
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              {language === 'te'
                ? 'తెలంగాణ ఎక్సైజ్ మరియు ఆడిట్ నిబంధనల ప్రకారం, ఈ వస్తువు ఇప్పటికే ఆర్డర్లలో భాగమై ఉంటే ఇది పూర్తిగా తొలగించబడదు, బదులుగా నిష్క్రియం చేయబడుతుంది.'
                : 'Under Telangana Excise audit regulations, if this SKU has existing customer order references, it will be safely deactivated rather than deleted to maintain full regulatory history.'}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="py-2.5 px-4 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold cursor-pointer"
              >
                {t('inventory.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmDeactivation}
                disabled={deleting}
                className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold shadow transition cursor-pointer"
              >
                {deleting ? 'Processing...' : (language === 'te' ? 'నిర్ధారించండి' : 'Confirm Removal')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          Bulk Inventory CSV Import Modal
      ========================================== */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="max-w-3xl w-full bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-stone-900 dark:text-stone-100">
                    Bulk Inventory Import (CSV)
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Upload or paste inventory CSV to create or update product SKUs in bulk
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setImportPreview(null);
                }}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template format hint */}
            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700/80 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-700 dark:text-stone-300">Expected CSV Columns:</span>
                <button
                  type="button"
                  onClick={() => {
                    const sample = "product_name,bottle_size,price,stock_quantity,low_stock_threshold,is_available\nRoyal Challenge Whisky,750ml,920.00,45,10,true\nAmrut Fusion Single Malt,750ml,4800.00,12,3,true\nOld Monk Rum,750ml,680.00,30,8,true";
                    setCsvText(sample);
                  }}
                  className="text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Load Sample CSV
                </button>
              </div>
              <code className="block bg-stone-200/70 dark:bg-stone-950/70 p-2 rounded-xl text-[11px] font-mono text-stone-800 dark:text-stone-200 overflow-x-auto">
                product_name,bottle_size,price,stock_quantity,low_stock_threshold,is_available
              </code>
            </div>

            {/* File upload or raw text paste */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 rounded-2xl cursor-pointer bg-stone-50/50 dark:bg-stone-800/50 transition">
                  <Upload className="w-6 h-6 text-stone-400 mb-1" />
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    {csvFile ? csvFile.name : 'Choose CSV file or drag & drop'}
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Or Paste Raw CSV Data:
                </label>
                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="product_name,bottle_size,price,stock_quantity,low_stock_threshold,is_available..."
                  className="w-full p-3 rounded-2xl border border-stone-200 dark:border-stone-700 outline-none bg-stone-50/50 dark:bg-stone-800/50 text-xs font-mono text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handlePreviewCsv}
                  disabled={previewLoading || !csvText.trim()}
                  className="py-2 px-4 rounded-xl text-xs font-bold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white disabled:opacity-50 transition flex items-center gap-2 cursor-pointer"
                >
                  {previewLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{previewLoading ? 'Parsing CSV...' : 'Preview Validation'}</span>
                </button>
              </div>
            </div>

            {/* Validation Preview Results */}
            {importPreview && (
              <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Import Preview & Validation
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      Total: {importPreview.total_rows}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                      Valid: {importPreview.valid_rows}
                    </span>
                    {importPreview.error_rows > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300">
                        Errors: {importPreview.error_rows}
                      </span>
                    )}
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto rounded-2xl border border-stone-200 dark:border-stone-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 dark:bg-stone-800/80 text-stone-500 dark:text-stone-400 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Row</th>
                        <th className="py-2 px-3">Product SKU</th>
                        <th className="py-2 px-3">Size</th>
                        <th className="py-2 px-3">Price</th>
                        <th className="py-2 px-3">Qty</th>
                        <th className="py-2 px-3">Action</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {importPreview.items?.map((row, idx) => (
                        <tr
                          key={idx}
                          className={row.is_valid ? 'hover:bg-stone-50 dark:hover:bg-stone-800/40' : 'bg-rose-50/50 dark:bg-rose-950/30'}
                        >
                          <td className="py-2 px-3 font-mono text-[11px] text-stone-400">{row.row_number}</td>
                          <td className="py-2 px-3 font-semibold text-stone-900 dark:text-stone-100">{row.product_name}</td>
                          <td className="py-2 px-3 text-stone-600 dark:text-stone-400">{row.bottle_size}</td>
                          <td className="py-2 px-3 font-bold text-stone-800 dark:text-stone-200">
                            {row.price ? `₹${row.price}` : '—'}
                          </td>
                          <td className="py-2 px-3 font-bold">{row.stock_quantity ?? '—'}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                row.action === 'create'
                                  ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                                  : row.action === 'update'
                                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                                  : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                              }`}
                            >
                              {row.action}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {row.is_valid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <Check className="w-3.5 h-3.5" /> Valid
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1" title={row.error_message}>
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate max-w-[150px]">{row.error_message}</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setImportPreview(null)}
                    className="py-2 px-4 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold cursor-pointer"
                  >
                    Reset Preview
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyImport}
                    disabled={applyingImport || !importPreview.valid_rows}
                    className="py-2 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow transition flex items-center gap-2 cursor-pointer"
                  >
                    {applyingImport && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{applyingImport ? 'Applying...' : `Apply ${importPreview.valid_rows} Valid SKUs`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
