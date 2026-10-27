const API_BASE = '/api/v1';

export function getStoredToken() {
  return localStorage.getItem('alco_access_token');
}

export function setStoredToken(token, role, user) {
  if (token) {
    localStorage.setItem('alco_access_token', token);
    localStorage.setItem('alco_user_role', role);
    localStorage.setItem('alco_user_profile', JSON.stringify(user));
  } else {
    localStorage.removeItem('alco_access_token');
    localStorage.removeItem('alco_user_role');
    localStorage.removeItem('alco_user_profile');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.detail?.message || data?.detail || data?.message || 'Request failed';
    const error = new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

// In-memory cache & in-flight promise deduplication to eliminate redundant network roundtrips
const requestCache = new Map();
const inflightRequests = new Map();

export async function cachedApiRequest(endpoint, ttlMs = 60000) {
  const now = Date.now();
  const cached = requestCache.get(endpoint);
  if (cached && (now - cached.timestamp < ttlMs)) {
    return cached.data;
  }

  // Deduplicate in-flight promises so concurrent requests share a single network call
  if (inflightRequests.has(endpoint)) {
    return inflightRequests.get(endpoint);
  }

  const promise = apiRequest(endpoint)
    .then((data) => {
      requestCache.set(endpoint, { data, timestamp: Date.now() });
      inflightRequests.delete(endpoint);
      return data;
    })
    .catch((err) => {
      inflightRequests.delete(endpoint);
      throw err;
    });

  inflightRequests.set(endpoint, promise);
  return promise;
}

export function invalidateCache(endpointPrefix) {
  if (!endpointPrefix) {
    requestCache.clear();
    return;
  }
  for (const key of requestCache.keys()) {
    if (key.startsWith(endpointPrefix)) {
      requestCache.delete(key);
    }
  }
}

export const api = {
  // Auth
  login: (credentials) => {
    invalidateCache();
    return apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  },
  register: (userData) => {
    invalidateCache();
    return apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
  },
  getMe: () => apiRequest('/auth/me'),

  // Catalog
  getCategories: () => cachedApiRequest('/categories', 120000), // 2 min cache
  getBrands: () => cachedApiRequest('/brands', 120000), // 2 min cache
  getCategory: (slug) => cachedApiRequest(`/categories/${slug}`, 120000),
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return apiRequest(`/products?${query.toString()}`);
  },
  getProduct: (id) => apiRequest(`/products/${id}`),

  // Retailers public
  getRetailers: () => cachedApiRequest('/retailers', 60000), // 1 min cache
  getRetailer: (id) => cachedApiRequest(`/retailers/${id}`, 30000),

  // Cart
  getCart: () => apiRequest('/cart'),
  addToCart: (inventoryId, quantity = 1) => apiRequest('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ inventory_id: inventoryId, quantity }),
  }),
  updateCartItem: (itemId, quantity) => apiRequest(`/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  }),
  removeCartItem: (itemId) => apiRequest(`/cart/items/${itemId}`, { method: 'DELETE' }),
  clearCart: () => apiRequest('/cart', { method: 'DELETE' }),

  // Orders & Simulated Checkout
  createTestOrder: (checkoutData) => apiRequest('/test-orders', {
    method: 'POST',
    body: JSON.stringify(checkoutData),
  }),
  getOrders: () => apiRequest('/orders'),
  getOrder: (id) => apiRequest(`/orders/${id}`),
  attemptLivePayment: (payload) => apiRequest('/orders/live-payment-attempt', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Customer Addresses & Profile
  getAddresses: () => apiRequest('/customer/addresses'),
  createAddress: (addrData) => apiRequest('/customer/addresses', {
    method: 'POST',
    body: JSON.stringify(addrData),
  }),
  getProfile: () => apiRequest('/customer/profile'),

  // Retailer Portal
  getRetailerDashboard: () => apiRequest('/retailer/dashboard'),
  getRetailerInventory: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category_id) query.set('category_id', params.category_id);
    if (params.brand) query.set('brand', params.brand);
    if (params.stock_status) query.set('stock_status', params.stock_status);
    if (params.listing_status) query.set('listing_status', params.listing_status);
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.sort_order) query.set('sort_order', params.sort_order);
    if (params.page) query.set('page', params.page);
    if (params.page_size) query.set('page_size', params.page_size);
    const qs = query.toString();
    return apiRequest(`/retailer/inventory${qs ? `?${qs}` : ''}`);
  },
  createInventoryItem: (invData) => apiRequest('/retailer/inventory', {
    method: 'POST',
    body: JSON.stringify(invData),
  }),
  updateInventoryItem: (id, updateData) => apiRequest(`/retailer/inventory/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  }),
  adjustInventoryStock: (id, adjustmentData) => apiRequest(`/retailer/inventory/${id}/adjust-stock`, {
    method: 'POST',
    body: JSON.stringify(adjustmentData),
  }),
  getInventoryMovements: (id) => apiRequest(`/retailer/inventory/${id}/movements`),
  deleteInventoryItem: (id) => apiRequest(`/retailer/inventory/${id}`, {
    method: 'DELETE',
  }),
  getRetailerOrders: () => apiRequest('/retailer/orders'),
  updateOrderStatus: (orderId, statusData) => apiRequest(`/retailer/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(statusData),
  }),
  submitRetailerApplication: (appData) => {
    invalidateCache('/retailers');
    return apiRequest('/retailer/applications', {
      method: 'POST',
      body: JSON.stringify(appData),
    });
  },

  // Admin Portal
  getAdminDashboard: () => apiRequest('/admin/dashboard'),
  getUsers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return apiRequest(`/admin/users${qs ? `?${qs}` : ''}`);
  },
  updateUser: (userId, data) => apiRequest(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteUser: (userId) => apiRequest(`/admin/users/${userId}`, {
    method: 'DELETE',
  }),
  getPendingRetailers: () => apiRequest('/admin/retailers/pending'),
  getAllRetailers: (status) => apiRequest(`/admin/retailers${status ? `?status=${status}` : ''}`),
  reviewRetailer: (id, reviewData) => {
    invalidateCache('/retailers');
    return apiRequest(`/admin/retailers/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(reviewData),
    });
  },
  getComplianceChecklist: () => apiRequest('/admin/compliance'),
  getAuditLogs: (page = 1, limit = 50) => apiRequest(`/admin/audit-logs?page=${page}&limit=${limit}`),
  getAllOrders: (page = 1, limit = 50) => apiRequest(`/admin/orders?page=${page}&limit=${limit}`),

  // Public Compliance & Health
  getComplianceStatus: () => apiRequest('/compliance-status'),
  getHealth: () => apiRequest('/health'),
};
