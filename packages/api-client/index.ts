import axios, { AxiosInstance, AxiosResponse } from 'axios';

class ApiClient {
  private instance: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:5000') {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.handleAuthError();
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    // This will be implemented differently for web vs mobile
    return localStorage?.getItem('token') || null;
  }

  private handleAuthError() {
    // Handle authentication errors
    // This will be implemented differently for web vs mobile
    console.log('Authentication error - redirecting to login');
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    return this.instance.post('/api/auth/login', credentials);
  }

  async logout() {
    return this.instance.post('/api/auth/logout');
  }

  async refreshToken() {
    return this.instance.post('/api/auth/refresh');
  }

  // Incident endpoints
  async getIncidents(params?: any) {
    return this.instance.get('/api/incidents', { params });
  }

  async createIncident(data: any) {
    return this.instance.post('/api/incidents', data);
  }

  async updateIncident(id: string, data: any) {
    return this.instance.put(`/api/incidents/${id}`, data);
  }

  async deleteIncident(id: string) {
    return this.instance.delete(`/api/incidents/${id}`);
  }

  // Vehicle endpoints
  async getVehicles(params?: any) {
    return this.instance.get('/api/vehicles', { params });
  }

  async updateVehicleStatus(id: string, status: string) {
    return this.instance.patch(`/api/vehicles/${id}/status`, { status });
  }

  // Generic CRUD methods
  async get<T = any>(endpoint: string, params?: any): Promise<AxiosResponse<T>> {
    return this.instance.get(endpoint, { params });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<AxiosResponse<T>> {
    return this.instance.post(endpoint, data);
  }

  async put<T = any>(endpoint: string, data?: any): Promise<AxiosResponse<T>> {
    return this.instance.put(endpoint, data);
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<AxiosResponse<T>> {
    return this.instance.patch(endpoint, data);
  }

  async delete<T = any>(endpoint: string): Promise<AxiosResponse<T>> {
    return this.instance.delete(endpoint);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;