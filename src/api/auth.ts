import { apiClient } from './client'
import { API_CONFIG } from '../config'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: 'STUDENT' | 'TRAINER'
}

export interface LoginResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
    status: string
    metadata?: Record<string, unknown>
  }
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface RefreshRequest {
  refreshToken: string
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export const authApi = {
  register: async (userData: RegisterRequest) => {
    const { data } = await apiClient.post<LoginResponse>(API_CONFIG.ENDPOINTS.REGISTER, userData)
    return data
  },

  login: async (credentials: LoginRequest) => {
    const { data } = await apiClient.post<LoginResponse>(API_CONFIG.ENDPOINTS.LOGIN, credentials)
    return data
  },

  refreshToken: async (refreshToken: string) => {
    const { data } = await apiClient.post<RefreshResponse>(API_CONFIG.ENDPOINTS.REFRESH, {
      refreshToken,
    })
    return data
  },

  logout: async () => {
    await apiClient.post(API_CONFIG.ENDPOINTS.LOGOUT)
  },
}
