import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
          Cookies.set('accessToken', data.data.accessToken, { expires: 7 });
          Cookies.set('refreshToken', data.data.refreshToken, { expires: 30 });
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        } catch {
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;

export const authApi = {
  staffLogin: (data: any) => api.post('/v1/auth/staff/login', data),
  superadminLogin: (data: any) => api.post('/v1/auth/superadmin/login', data),
  clientAuth: (slug: string, data: any) => api.post(`/v1/auth/client/${slug}`, data),
  clientPhoneAuth: (data: any) => api.post('/v1/auth/client/phone', data),
  refresh: (refreshToken: string) => api.post('/v1/auth/refresh', { refreshToken }),
  logout: () => api.post('/v1/auth/logout'),
};

export const usersApi = {
  me: () => api.get('/v1/users/me'),
  getAll: (params?: any) => api.get('/v1/users', { params }),
  getStaff: () => api.get('/v1/users/staff'),
  create: (data: any) => api.post('/v1/users', data),
  update: (id: string, data: any) => api.patch(`/v1/users/${id}`, data),
  updateMe: (data: any) => api.patch('/v1/users/me', data),
  delete: (id: string) => api.delete(`/v1/users/${id}`),
};

export const publicApi = {
  getTenants: () => api.get('/v1/tenants/public'),
};

export const tenantsApi = {
  getAll: (params?: any) => api.get('/v1/tenants', { params }),
  getOne: (id: string) => api.get(`/v1/tenants/${id}`),
  create: (data: any) => api.post('/v1/tenants', data),
  update: (id: string, data: any) => api.patch(`/v1/tenants/${id}`, data),
  toggleStatus: (id: string, status: string) => api.patch(`/v1/tenants/${id}/status`, { status }),
  getStats: (id: string) => api.get(`/v1/tenants/${id}/stats`),
  delete: (id: string) => api.delete(`/v1/tenants/${id}`),
};

export const categoriesApi = {
  getAll: (params?: any) => api.get('/v1/categories', { params }),
  create: (data: any) => api.post('/v1/categories', data),
  update: (id: string, data: any) => api.patch(`/v1/categories/${id}`, data),
  delete: (id: string) => api.delete(`/v1/categories/${id}`),
};

export const productsApi = {
  getAll: (params?: any) => api.get('/v1/products', { params }),
  getOne: (id: string) => api.get(`/v1/products/${id}`),
  getStopList: () => api.get('/v1/products/stop-list'),
  create: (data: any) => api.post('/v1/products', data),
  update: (id: string, data: any) => api.patch(`/v1/products/${id}`, data),
  toggleStopList: (id: string, isStopList: boolean) => api.patch(`/v1/products/${id}/stop-list`, { isStopList }),
  delete: (id: string) => api.delete(`/v1/products/${id}`),
};

export const tablesApi = {
  getAll: (params?: any) => api.get('/v1/tables', { params }),
  getByTenant: (tenantId: string, status?: string) => api.get('/v1/tables', { params: { tenantId, status } }),
  create: (data: any) => api.post('/v1/tables', data),
  update: (id: string, data: any) => api.patch(`/v1/tables/${id}`, data),
  updateStatus: (id: string, status: string, tenantId?: string) => api.patch(`/v1/tables/${id}/status`, { status, tenantId }),
  generateQr: (id: string) => api.post(`/v1/tables/${id}/qr`),
  delete: (id: string) => api.delete(`/v1/tables/${id}`),
};

export const ordersApi = {
  getAll: (params?: any) => api.get('/v1/orders', { params }),
  getOne: (id: string) => api.get(`/v1/orders/${id}`),
  create: (data: any) => api.post('/v1/orders', data),
  updateStatus: (id: string, status: string) => api.patch(`/v1/orders/${id}/status`, { status }),
  pay: (id: string) => api.patch(`/v1/orders/${id}/status`, { status: 'completed' }),
  updateItemStatus: (itemId: string, status: string) => api.patch(`/v1/orders/items/${itemId}/status`, { status }),
  addItems: (id: string, data: any) => api.post(`/v1/orders/${id}/items`, data),
  applyDiscount: (id: string, discountAmount: number) => api.patch(`/v1/orders/${id}/discount`, { discountAmount }),
  getKitchen: () => api.get('/v1/orders/kitchen'),
  getTableActive: (tableId: string) => api.get(`/v1/orders/table/${tableId}/active`),
  getMyOrders: (tenantId: string) => api.get('/v1/orders', { params: { tenantId } }),
};

export const paymentsApi = {
  process: (orderId: string, data: any) => api.post(`/v1/payments/orders/${orderId}`, data),
  splitBill: (orderId: string, splits: any[]) => api.post(`/v1/payments/orders/${orderId}/split`, { splits }),
  requestRefund: (orderId: string, data: any) => api.post(`/v1/payments/orders/${orderId}/refund-request`, data),
  processRefund: (id: string, data: any) => api.patch(`/v1/payments/refunds/${id}`, data),
  getAll: (params?: any) => api.get('/v1/payments', { params }),
  getRefunds: (status?: string) => api.get('/v1/payments/refunds', { params: { status } }),
};

export const reportsApi = {
  getDashboard: () => api.get('/v1/reports/dashboard'),
  getSuperAdminStats: () => api.get('/v1/reports/superadmin/stats'),
  getSales: (params?: any) => api.get('/v1/reports/sales', { params }),
  getTopProducts: (params?: any) => api.get('/v1/reports/top-products', { params }),
  getWaiterPerformance: (params?: any) => api.get('/v1/reports/waiter-performance', { params }),
  getPeakHours: () => api.get('/v1/reports/peak-hours'),
  getCancellations: () => api.get('/v1/reports/cancellations'),
};

export const subscriptionsApi = {
  getPlans: () => api.get('/v1/subscriptions/plans'),
  getMy: () => api.get('/v1/subscriptions/my'),
  subscribe: (planId: string) => api.post(`/v1/subscriptions/subscribe/${planId}`),
  cancel: () => api.post('/v1/subscriptions/cancel'),
  createPlan: (data: any) => api.post('/v1/subscriptions/plans', data),
  updatePlan: (id: string, data: any) => api.patch(`/v1/subscriptions/plans/${id}`, data),
  getAll: (params?: any) => api.get('/v1/subscriptions', { params }),
};

export const settingsApi = {
  get: () => api.get('/v1/settings'),
  update: (data: any) => api.patch('/v1/settings', data),
};

export const inventoryApi = {
  getAll: (params?: any) => api.get('/v1/inventory', { params }),
  getLowStock: () => api.get('/v1/inventory/low-stock'),
  create: (data: any) => api.post('/v1/inventory', data),
  update: (id: string, data: any) => api.patch(`/v1/inventory/${id}`, data),
  adjust: (id: string, data: any) => api.post(`/v1/inventory/${id}/adjust`, data),
  getLogs: (params?: any) => api.get('/v1/inventory/logs', { params }),
};

export const branchesApi = {
  getAll: () => api.get('/v1/branches'),
  create: (data: any) => api.post('/v1/branches', data),
  update: (id: string, data: any) => api.patch(`/v1/branches/${id}`, data),
  delete: (id: string) => api.delete(`/v1/branches/${id}`),
};

export const discountsApi = {
  getAll: () => api.get('/v1/discounts'),
  create: (data: any) => api.post('/v1/discounts', data),
  getPromoCodes: () => api.get('/v1/discounts/promo-codes'),
  createPromoCode: (data: any) => api.post('/v1/discounts/promo-codes', data),
  validatePromoCode: (code: string, orderAmount: number) => api.post('/v1/discounts/promo-codes/validate', { code, orderAmount }),
};

export const clientApi = {
  getHistory: (params?: any) => api.get('/v1/client/history', { params }),
  getMyTenants: () => api.get('/v1/client/tenants'),
};

export const ratingsApi = {
  upsert: (data: any) => api.post('/v1/ratings', data),
  getMy: () => api.get('/v1/ratings/my'),
  getTenantRating: (tenantId: string) => api.get(`/v1/ratings/tenant/${tenantId}`),
  getTenantRatings: (tenantId: string) => api.get(`/v1/ratings/tenant/${tenantId}/all`),
};

export const menuApi = {
  getMenu: (slug: string) => api.get(`/v1/menu/${slug}`),
  getCategories: (slug: string) => api.get(`/v1/menu/${slug}/categories`),
  getProducts: (slug: string, categoryId?: string) => api.get(`/v1/menu/${slug}/products`, { params: { categoryId } }),
};

export const uploadApi = {
  uploadVideo: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/v1/upload/video', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/v1/upload/image', form, {
      headers: { 'Content-Type': undefined as any },
      timeout: 60000,
    });
  },
};

export const notificationsApi = {
  getAll: () => api.get('/v1/notifications'),
  getUnreadCount: () => api.get('/v1/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/v1/notifications/${id}/read`),
  markAllRead: () => api.patch('/v1/notifications/read-all'),
};
