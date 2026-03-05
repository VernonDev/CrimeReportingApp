import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to all requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 by redirecting to login
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ success: true; data: { token: string; user: User } }>('/auth/login', {
      email,
      password,
    }),
  signup: (email: string, username: string, password: string) =>
    api.post<{ success: true; data: { token: string; user: User } }>('/auth/signup', {
      email,
      username,
      password,
    }),
  me: () => api.get<{ success: true; data: User }>('/auth/me'),
};

// ---- Reports ----
export const reportsApi = {
  list: (params?: ReportQuery) =>
    api.get<{ success: true; data: Report[]; pagination: Pagination }>('/reports', { params }),
  get: (id: number) => api.get<{ success: true; data: Report }>(`/reports/${id}`),
  create: (data: CreateReportData) =>
    api.post<{ success: true; data: Report }>('/reports', data),
  update: (id: number, data: Partial<CreateReportData>) =>
    api.patch<{ success: true; data: Report }>(`/reports/${id}`, data),
  delete: (id: number) => api.delete(`/reports/${id}`),
  verify: (id: number) => api.post(`/reports/${id}/verify`),
  reject: (id: number) => api.post(`/reports/${id}/reject`),
  flag: (id: number, reason: string, details?: string) =>
    api.post(`/reports/${id}/flag`, { reason, details }),
  myReports: () => api.get<{ success: true; data: Report[] }>('/users/me/reports'),
};

// ---- Categories ----
export const categoriesApi = {
  list: () => api.get<{ success: true; data: Category[] }>('/categories'),
};

// ---- Upload ----
export const uploadApi = {
  upload: (files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('file', f));
    return api.post<{ success: true; data: { paths: string[] } }>('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ---- Types ----
export interface User {
  id: number;
  email: string;
  username: string;
  role: 'user' | 'moderator' | 'admin';
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  severity: number;
  icon?: string;
  color: string;
  active: boolean;
}

export interface Report {
  id: number;
  reporterId?: number;
  title: string;
  description: string;
  latitude: string;
  longitude: string;
  address?: string;
  neighborhood?: string;
  incidentDate: string;
  status: 'pending' | 'verified' | 'flagged' | 'rejected' | 'archived';
  isAnonymous: boolean;
  photoPaths?: string[];
  createdAt: string;
  updatedAt?: string;
  verifiedAt?: string;
  category: Pick<Category, 'id' | 'name' | 'color' | 'severity' | 'icon'>;
}

export interface ReportQuery {
  status?: string;
  categoryId?: number;
  neLat?: number;
  neLng?: number;
  swLat?: number;
  swLng?: number;
  limit?: number;
  offset?: number;
}

export interface CreateReportData {
  location: { lat: number; lng: number };
  categoryId: number;
  title: string;
  description: string;
  incidentDate: string;
  isAnonymous?: boolean;
  address?: string;
  neighborhood?: string;
  photoPaths?: string[];
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}
