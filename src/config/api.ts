export const DEFAULT_DOMAIN = 'runmyshop.in';

export const getBaseUrl = (tenant?: string | null) => {
  if (tenant && tenant.trim() !== '') {
    return `https://${tenant.trim()}.${DEFAULT_DOMAIN}/api`;
  }
  return `https://api.${DEFAULT_DOMAIN}/api`; // Default fallback
};

export const API_CONFIG = {
  ENDPOINTS: {
    HEALTH: '/health',
    LOGIN: '/admin/login',
    VERIFY: '/admin/verify',
    DASHBOARD_STATS: '/admin/dashboard-stats',
    CUSTOMERS: '/customers',
    BILLS: '/bills',
    REPORTS: '/reports',
    EMPLOYEES: '/employees',
    REVENUE: '/revenue',
    USERS: '/users',
    SETTINGS: '/settings',
    APPOINTMENTS: '/appointments',
    SERVICES: '/services',
    PRODUCTS: '/products',
    PACKAGES: '/packages',
    CATEGORIES: '/categories',
  }
};
