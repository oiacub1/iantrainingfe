// Configuración centralizada de la aplicación

export const API_CONFIG = {
  // Backend API URLs
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  API_VERSION: 'v1',
  ENDPOINTS: {
    // Exercises
    EXERCISES: '/exercises',
    EXERCISE_BY_ID: (id: string) => `/exercises/${id}`,
    
    // Users (unificado)
    USERS: '/users',
    USER_BY_ID: (id: string) => `/users/${id}`,
    
    // Trainer specific
    TRAINERS_STUDENTS: (trainerId: string) => `/trainers/${trainerId}/students`,
    TRAINERS_STUDENTS_ASSIGN_BY_EMAIL: (trainerId: string) =>
      `/trainers/${trainerId}/students/assign-by-email`,
    
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  
  // Headers
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}${endpoint}`
}

export const getApiUrlWithParams = (endpoint: string, params: Record<string, string | number>): string => {
  const url = getApiUrl(endpoint)
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })
  
  return searchParams.toString() ? `${url}?${searchParams.toString()}` : url
}

// Configuración de la aplicación
export const APP_CONFIG = {
  NAME: 'Training Platform',
  VERSION: '1.0.0',
  
  // Paginación
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Timeouts (ms)
  API_TIMEOUT: 30000,
  DEBOUNCE_DELAY: 300,
  
  // LocalStorage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    LANGUAGE: 'language',
    THEME: 'theme',
  },
  
  // Roles de usuario
  USER_ROLES: {
    TRAINER: 'TRAINER',
    STUDENT: 'STUDENT',
    ADMIN: 'ADMIN',
  },
  
  // Estados de usuario
  USER_STATUS: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    PENDING: 'PENDING',
  },
  
  // Dificultad de ejercicios
  EXERCISE_DIFFICULTY: {
    BEGINNER: 'BEGINNER',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
  },
  
  // Niveles de fitness
  FITNESS_LEVELS: {
    BEGINNER: 'BEGINNER',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
  },
} as const

// Configuración de i18n
export const I18N_CONFIG = {
  DEFAULT_LANGUAGE: 'en',
  SUPPORTED_LANGUAGES: ['en', 'es'],
  FALLBACK_LANGUAGE: 'en',
  
  // Namespace para keys compartidos
  NAMESPACES: {
    COMMON: 'common',
    EXERCISES: 'exercises',
    USERS: 'users',
    AUTH: 'auth',
    ERRORS: 'errors',
  },
} as const

// Configuración de UI
export const UI_CONFIG = {
  // Breakpoints (px)
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    XXL: 1536,
  },
  
  // Colores (si necesitas override de Tailwind)
  COLORS: {
    PRIMARY: {
      50: '#f0f9ff',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
    },
    SUCCESS: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
    },
    ERROR: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
    },
  },
  
  // Animaciones (ms)
  ANIMATIONS: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
} as const

// Environment detection
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isTest: import.meta.env.MODE === 'test',
} as const

// Exportar todo para fácil import
export const CONFIG = {
  API: API_CONFIG,
  APP: APP_CONFIG,
  I18N: I18N_CONFIG,
  UI: UI_CONFIG,
  ENV: ENV_CONFIG,
} as const

// Type helpers
export type UserRole = typeof APP_CONFIG.USER_ROLES[keyof typeof APP_CONFIG.USER_ROLES]
export type UserStatus = typeof APP_CONFIG.USER_STATUS[keyof typeof APP_CONFIG.USER_STATUS]
export type ExerciseDifficulty = typeof APP_CONFIG.EXERCISE_DIFFICULTY[keyof typeof APP_CONFIG.EXERCISE_DIFFICULTY]
export type FitnessLevel = typeof APP_CONFIG.FITNESS_LEVELS[keyof typeof APP_CONFIG.FITNESS_LEVELS]
