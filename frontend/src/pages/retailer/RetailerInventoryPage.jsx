import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Edit2,
  Check,
  X,
  ArrowLeft,
  Search
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function RetailerInventoryPage() {
  const { t, language } = useLanguage();
  const [inventory, setInventory] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editAvailable, setEditAvailable] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add listing modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductId, setNewProductId] = useState('');
  const [newBottleSize, setNewBottleSize] = useState('750ml');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('10');
  const [addError, setAddError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [invData, prodData] = await Promise.all([
          api.getRetailerInventory(),
          api.getProducts({ limit: 100 }),
        ]);
        setInventory(invData || []);
        setCatalogProducts(prodData?.items || []);
        if (prodData?.items?.length > 0) {
          setNewProductId(prodData.items[0].id);
        }
      } catch (err) {
        setError(err.message || 'Failed to load retailer inventory');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditPrice(item.price);
    setEditStock(item.stock_quantity);
    setEditAvailable(item.is_available);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPrice('');
    setEditStock('');
  };

  const saveEdit = async (inventoryId) => {
    try {
      setSaving(true);
      const updated = await api.updateInventoryItem(inventoryId, {
        price: parseFloat(editPrice),
        stock_quantity: parseInt(editStock, 10),
        is_available: editAvailable
      });
      setInventory(inventory.map((item) => (item.id === inventoryId ? updated : item)));
      setEditingId(null);
    } catch (err) {
      alert(err.message || 'Failed to update inventory item');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setAddError(null);
    try {
      const created = await api.createInventoryItem({
        product_id: newProductId,
        bottle_size: newBottleSize,
        price: parseFloat(newPrice),
        stock_quantity: parseInt(newStock, 10),
        is_available: true
      });
      setInventory([created, ...inventory]);
      setShowAddModal(false);
      setNewPrice('');
      alert(language === 'te' ? 'షాపు ఇన్వెంటరీకి ఉత్పత్తి విజయవంతంగా జోడించబడింది!' : 'Product SKU added to shop inventory successfully!');
    } catch (err) {
      setAddError(err.message || 'Failed to add listing');
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const term = searchFilter.toLowerCase();
    const prod = catalogProducts.find((p) => p.id === item.product_id);
    const name = prod?.name?.toLowerCase() || '';
    const brand = prod?.brand?.toLowerCase() || '';
    const size = item.bottle_size?.toLowerCase() || '';
    return name.includes(term) || brand.includes(term) || size.includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 transition-colors duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <Link to="/retailer" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> {language === 'te' ? 'రిటైలర్ డాష్‌బోర్డ్‌కు తిరిగి వెళ్లండి' : 'Back to Retailer Dashboard'}
          </Link>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            {t('inventory.title')}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {t('inventory.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow transition flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          {t('inventory.addBtn')}
        </button>
      </div>

      {/* Search Input */}
      <div className="max-w-md relative">
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder={t('inventory.searchPlaceholder')}
          className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:ring-2 focus:ring-amber-500/20"
        />
        <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400">Loading shop inventory...</div>
        ) : filteredInventory.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto" />
            <h3 className="font-bold text-sm text-stone-800 dark:text-stone-200">{t('inventory.noItems')}</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {language === 'te'
                ? 'తెలంగాణ ఆమోదిత కేటలాగ్ నుండి ఉత్పత్తులను ప్రచురించడానికి "కొత్త ఉత్పత్తిని జోడించండి" క్లిక్ చేయండి.'
                : 'Click "Add Product Listing" to publish products from the approved Telangana catalogue.'}
            </p>
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
                  <th className="py-3 px-4">{t('inventory.thStatus')}</th>
                  <th className="py-3 px-4 text-right">{t('inventory.thActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredInventory.map((item) => {
                  const prod = catalogProducts.find((p) => p.id === item.product_id);
                  const isEditing = editingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/50 transition">
                      
                      {/* Product Name */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-stone-900 dark:text-stone-100 block">{prod?.name || 'Registered Product'}</span>
                        <span className="text-[10px] text-amber-800 dark:text-amber-400 font-semibold uppercase">{prod?.brand || 'Spirits'}</span>
                      </td>

                      {/* Bottle Size */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-stone-700 dark:text-stone-300">
                        <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-[11px] border border-stone-200 dark:border-stone-700">
                          {item.bottle_size}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-24 p-1.5 border rounded text-xs font-bold bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600"
                          />
                        ) : (
                          `₹${Number(item.price).toLocaleString('en-IN')}`
                        )}
                      </td>

                      {/* Stock Units */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            className="w-20 p-1.5 border rounded text-xs bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600"
                          />
                        ) : (
                          <span className={`font-semibold ${item.stock_quantity <= 5 ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-stone-800 dark:text-stone-200'}`}>
                            {item.stock_quantity} {language === 'te' ? 'యూనిట్లు' : 'units'}
                          </span>
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
                            />
                            <span>{language === 'te' ? 'షాపులో సక్రియం' : 'Active in shop'}</span>
                          </label>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.is_available && item.stock_quantity > 0
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700'
                          }`}>
                            {item.is_available && item.stock_quantity > 0 ? t('inventory.inStock') : t('inventory.outOfStock')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => saveEdit(item.id)}
                              disabled={saving}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                              title={t('inventory.save')}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 rounded-lg"
                              title={t('inventory.cancel')}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-800 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-stone-800 transition"
                            title={t('inventory.edit')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add SKU Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                {language === 'te' ? 'షాపుకు కొత్త ఉత్పత్తి SKU జోడించండి' : 'Add Product SKU to Shop'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  {language === 'te' ? 'కేటలాగ్ ఉత్పత్తిని ఎంచుకోండి' : 'Select Catalogue Product'}
                </label>
                <select
                  value={newProductId}
                  onChange={(e) => setNewProductId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 outline-none bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  required
                >
                  {catalogProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">{t('inventory.thSize')}</label>
                <select
                  value={newBottleSize}
                  onChange={(e) => setNewBottleSize(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 outline-none bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                >
                  <option value="750ml">750ml (Full Bottle)</option>
                  <option value="375ml">375ml (Half Bottle)</option>
                  <option value="180ml">180ml (Quarter)</option>
                  <option value="650ml">650ml (Beer Bottle)</option>
                  <option value="330ml">330ml (Pint / Can)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">{t('inventory.thPrice')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. 1850.00"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 outline-none bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">{t('inventory.thStock')}</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="10"
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 outline-none bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    required
                  />
                </div>
              </div>

              {addError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl">
                  {addError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold"
                >
                  {t('inventory.cancel')}
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow"
                >
                  {t('inventory.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
