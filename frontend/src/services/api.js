const isDev = import.meta.env.DEV;
const API_BASE = import.meta.env.VITE_API_BASE_URL || (isDev ? '/api/v1' : 'https://alcorez.onrender.com/api/v1');

export function getStoredToken() {
  try {
    const sessionToken = sessionStorage.getItem('alco_access_token');
    if (sessionToken) {
      return sessionToken;
    }
    if (sessionStorage.getItem('alco_session_cleared') === '1') {
      return null;
    }
    const localToken = localStorage.getItem('alco_access_token');
    if (localToken) {
      sessionStorage.setItem('alco_access_token', localToken);
      const localRole = localStorage.getItem('alco_user_role');
      if (localRole) sessionStorage.setItem('alco_user_role', localRole);
      const localUser = localStorage.getItem('alco_user_profile');
      if (localUser) sessionStorage.setItem('alco_user_profile', localUser);
      return localToken;
    }
  } catch (err) {
    console.warn('Error reading stored token:', err);
  }
  return null;
}

export function getStoredRefreshToken() {
  try {
    return sessionStorage.getItem('alco_refresh_token');
  } catch {
    return null;
  }
}

export function getStoredRole() {
  try {
    const sessionRole = sessionStorage.getItem('alco_user_role');
    if (sessionRole) return sessionRole;
    const sessionToken = sessionStorage.getItem('alco_access_token');
    if (sessionToken) {
      return 'customer';
    }
    if (sessionStorage.getItem('alco_session_cleared') === '1') {
      return 'customer';
    }
    const localRole = localStorage.getItem('alco_user_role');
    if (localRole) {
      sessionStorage.setItem('alco_user_role', localRole);
      return localRole;
    }
  } catch {
    // fallback
  }
  return 'customer';
}

export function getStoredUser() {
  try {
    const sessionUser = sessionStorage.getItem('alco_user_profile');
    if (sessionUser && sessionUser !== 'undefined') {
      return JSON.parse(sessionUser);
    }
    const sessionToken = sessionStorage.getItem('alco_access_token');
    if (sessionToken) {
      return null;
    }
    if (sessionStorage.getItem('alco_session_cleared') === '1') {
      return null;
    }
    const localUser = localStorage.getItem('alco_user_profile');
    if (localUser && localUser !== 'undefined') {
      sessionStorage.setItem('alco_user_profile', localUser);
      return JSON.parse(localUser);
    }
  } catch {
    // fallback
  }
  return null;
}

export function setStoredToken(token, role, user, refreshToken) {
  try {
    if (token) {
      sessionStorage.removeItem('alco_session_cleared');
      sessionStorage.setItem('alco_access_token', token);
      if (refreshToken) sessionStorage.setItem('alco_refresh_token', refreshToken);
      sessionStorage.setItem('alco_user_role', role || 'customer');
      if (user) {
        sessionStorage.setItem('alco_user_profile', JSON.stringify(user));
      }
      localStorage.setItem('alco_access_token', token);
      localStorage.setItem('alco_user_role', role || 'customer');
      if (user) {
        localStorage.setItem('alco_user_profile', JSON.stringify(user));
      }
    } else {
      const currentToken = sessionStorage.getItem('alco_access_token');
      sessionStorage.setItem('alco_session_cleared', '1');
      sessionStorage.removeItem('alco_access_token');
      sessionStorage.removeItem('alco_refresh_token');
      sessionStorage.removeItem('alco_user_role');
      sessionStorage.removeItem('alco_user_profile');
      if (localStorage.getItem('alco_access_token') === currentToken) {
        localStorage.removeItem('alco_access_token');
        localStorage.removeItem('alco_user_role');
        localStorage.removeItem('alco_user_profile');
      }
    }
  } catch (err) {
    console.warn('Error setting stored token:', err);
  }
}

let refreshInFlight = null;

async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;
  refreshInFlight = fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  }).then(async (response) => {
    if (!response.ok) return null;
    const data = await response.json();
    if (getStoredRefreshToken() !== refreshToken) return null;
    setStoredToken(data.access_token, data.role, {
      id: data.user_id, email: data.email, full_name: data.full_name, role: data.role,
    }, data.refresh_token);
    invalidateCache();
    return data.access_token;
  }).finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      'Unable to reach backend server. The free instance may be waking up (takes ~30s), or connection was blocked.'
    );
  }

  if (response.status === 401 && !endpoint.startsWith('/auth/')) {
    let freshToken = null;
    try {
      freshToken = await refreshAccessToken();
    } catch {
      // Preserve the original unauthorized response if refresh is unavailable.
    }
    if (freshToken) {
      response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${freshToken}` },
      });
    }
    if (response.status === 401 && getStoredToken() === (freshToken || token)) {
      window.dispatchEvent(new Event('alco_session_expired'));
    }
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let errorMsg = data?.detail?.message || data?.detail || data?.message;
    if (!errorMsg) {
      if (response.status === 404) {
        errorMsg = `API route not found (404) at ${API_BASE}${endpoint}`;
      } else if (response.status === 401) {
        errorMsg = endpoint === '/auth/login' ? 'Incorrect email or password.' : 'Your session has expired. Please sign in again.';
      } else if (response.status === 502 || response.status === 503) {
        errorMsg = 'Backend server is starting up. Please try again in 15 seconds.';
      } else {
        errorMsg = `Request failed with status ${response.status}`;
      }
    }
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
let cacheEpoch = 0;

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

  const epoch = cacheEpoch;
  const promise = apiRequest(endpoint)
    .then((data) => {
      if (epoch === cacheEpoch) requestCache.set(endpoint, { data, timestamp: Date.now() });
      if (inflightRequests.get(endpoint) === promise) inflightRequests.delete(endpoint);
      return data;
    })
    .catch((err) => {
      if (inflightRequests.get(endpoint) === promise) inflightRequests.delete(endpoint);
      throw err;
    });

  inflightRequests.set(endpoint, promise);
  return promise;
}

export function invalidateCache(endpointPrefix) {
  if (!endpointPrefix) {
    cacheEpoch += 1;
    requestCache.clear();
    inflightRequests.clear();
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
    invalidateCache('/cart');
    invalidateCache('/orders');
    invalidateCache('/auth');
    return apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  },
  register: (userData) => {
    invalidateCache('/cart');
    invalidateCache('/orders');
    invalidateCache('/auth');
    return apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
  },
  getMe: () => apiRequest('/auth/me'),
  refreshSession: refreshAccessToken,
  logout: async (refreshToken) => {
    const accessToken = getStoredToken();
    const revoke = (token, rotatingToken) => fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ refresh_token: rotatingToken }),
    });
    if (!accessToken) return;
    let response = await revoke(accessToken, refreshToken);
    if (response.status === 401 && refreshToken) {
      const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (refreshed.ok) {
        const data = await refreshed.json();
        response = await revoke(data.access_token, data.refresh_token);
      }
    }
    if (!response.ok) throw new Error('Server logout failed');
  },

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
    const qs = query.toString();
    return cachedApiRequest(`/products${qs ? `?${qs}` : ''}`, 30000); // 30s cache
  },
  getProduct: (id) => cachedApiRequest(`/products/${id}`, 60000), // 1 min cache

  // Retailers public
  getRetailers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.postal_code) query.set('postal_code', params.postal_code);
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return cachedApiRequest(`/retailers${qs ? `?${qs}` : ''}`, 60000); // 1 min cache
  },
  getRetailer: (id) => cachedApiRequest(`/retailers/${id}`, 30000),
  getRetailerCatalogue: (id, params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    const qs = query.toString();
    return cachedApiRequest(`/retailers/${id}/catalogue${qs ? `?${qs}` : ''}`, 30000); // 30s cache
  },

  // Cart
  getCart: () => apiRequest('/cart'),
  addToCart: (inventoryId, quantity = 1) => {
    invalidateCache('/cart');
    return apiRequest('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ inventory_id: inventoryId, quantity }),
    });
  },
  updateCartItem: (itemId, quantity) => {
    invalidateCache('/cart');
    return apiRequest(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },
  removeCartItem: (itemId) => {
    invalidateCache('/cart');
    return apiRequest(`/cart/items/${itemId}`, { method: 'DELETE' });
  },
  clearCart: () => {
    invalidateCache('/cart');
    return apiRequest('/cart', { method: 'DELETE' });
  },

  // Customer Favorites (Feature A)
  getFavorites: () => cachedApiRequest('/customer/favorites', 30000),
  getFavoriteIds: () => cachedApiRequest('/customer/favorites/ids', 30000),
  addFavoriteProduct: (productId) => {
    invalidateCache('/customer/favorites');
    return apiRequest(`/customer/favorites/products/${productId}`, { method: 'POST' });
  },
  removeFavoriteProduct: (productId) => {
    invalidateCache('/customer/favorites');
    return apiRequest(`/customer/favorites/products/${productId}`, { method: 'DELETE' });
  },
  addFavoriteRetailer: (retailerId) => {
    invalidateCache('/customer/favorites');
    return apiRequest(`/customer/favorites/retailers/${retailerId}`, { method: 'POST' });
  },
  removeFavoriteRetailer: (retailerId) => {
    invalidateCache('/customer/favorites');
    return apiRequest(`/customer/favorites/retailers/${retailerId}`, { method: 'DELETE' });
  },

  // Notification Center (Feature C)
  getNotifications: (params = {}) => {
    const query = new URLSearchParams();
    if (params.unread_only) query.set('unread_only', 'true');
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    const qs = query.toString();
    return apiRequest(`/notifications${qs ? `?${qs}` : ''}`);
  },
  getUnreadNotificationCount: () => apiRequest('/notifications/unread-count'),
  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/notifications/mark-all-read', { method: 'POST' }),

  // Orders & Simulated Checkout
  createTestOrder: (checkoutData) => {
    invalidateCache('/cart');
    invalidateCache('/products');
    invalidateCache('/orders');
    return apiRequest('/test-orders', {
      method: 'POST',
      body: JSON.stringify(checkoutData),
    });
  },
  getOrders: () => apiRequest('/orders'),
  getOrder: (id) => apiRequest(`/orders/${id}`),
  cancelOrder: (id) => apiRequest(`/orders/${id}/cancel`, { method: 'POST' }),
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
  createInventoryItem: (invData) => {
    invalidateCache('/products');
    invalidateCache('/retailer');
    return apiRequest('/retailer/inventory', {
      method: 'POST',
      body: JSON.stringify(invData),
    });
  },
  updateInventoryItem: (id, updateData) => {
    invalidateCache('/products');
    invalidateCache('/retailer');
    return apiRequest(`/retailer/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  },
  adjustInventoryStock: (id, adjustmentData) => {
    invalidateCache('/products');
    invalidateCache('/retailer');
    return apiRequest(`/retailer/inventory/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify(adjustmentData),
    });
  },
  getInventoryMovements: (id) => apiRequest(`/retailer/inventory/${id}/movements`),
  deleteInventoryItem: (id) => {
    invalidateCache('/products');
    invalidateCache('/retailer');
    return apiRequest(`/retailer/inventory/${id}`, {
      method: 'DELETE',
    });
  },

  // Bulk Inventory CSV (Feature D)
  exportInventoryCsv: async () => {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE}/retailer/inventory/export`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });
    if (!res.ok) throw new Error('Failed to export inventory CSV');
    return await res.text();
  },
  previewInventoryImport: (raw_csv) => apiRequest('/retailer/inventory/import/preview', {
    method: 'POST',
    body: JSON.stringify({ raw_csv }),
  }),
  applyInventoryImport: (items) => {
    invalidateCache('/products');
    invalidateCache('/retailer');
    return apiRequest('/retailer/inventory/import/apply', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  getRetailerOrders: () => apiRequest('/retailer/orders'),
  updateOrderStatus: (orderId, statusData) => {
    invalidateCache('/orders');
    return apiRequest(`/retailer/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  },
  submitRetailerApplication: (appData) => {
    invalidateCache('/retailers');
    return apiRequest('/retailer/applications', {
      method: 'POST',
      body: JSON.stringify(appData),
    });
  },

  // Admin Portal
  getAdminDashboard: () => apiRequest('/admin/dashboard'),
  createAdminUser: (userData) => apiRequest('/admin/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
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
    invalidateCache('/products');
    return apiRequest(`/admin/retailers/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(reviewData),
    });
  },
  getComplianceChecklist: () => apiRequest('/admin/compliance'),
  getAuditLogs: (page = 1, limit = 50) => apiRequest(`/admin/audit-logs?page=${page}&limit=${limit}`),
  getAllOrders: (page = 1, limit = 50) => apiRequest(`/admin/orders?page=${page}&limit=${limit}`),

  // Public Compliance & Health
  getComplianceStatus: () => cachedApiRequest('/compliance-status', 300000),
  getHealth: () => apiRequest('/health'),
};
