import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Dumbbell } from 'lucide-react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authApi.login({ email, password })
      
      login({
        ...response.user,
        role: response.user.role as 'TRAINER' | 'STUDENT'
      }, response.accessToken)
      
      localStorage.setItem('refreshToken', response.refreshToken)
      
      if (response.user.role === 'TRAINER') {
        navigate('/trainer/dashboard')
      } else {
        navigate('/student/dashboard')
      }
    } catch (err: unknown) {
      console.error('Login failed:', err)
      
      const status = axios.isAxiosError(err) ? err.response?.status : undefined

      if (status === 401) {
        setError('Usuario o contraseña incorrectos')
      } else if (status === 400) {
        setError('Por favor completa todos los campos correctamente')
      } else if (typeof status === 'number' && status >= 500) {
        setError('Error del servidor. Intenta nuevamente más tarde')
      } else {
        setError('Error al iniciar sesión. Intenta nuevamente')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Dumbbell className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('common.app_name')}
          </h1>
          <p className="text-primary-100">
            {t('common.welcome')}
          </p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            {t('auth.login')}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="trainer@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary"
            >
              {loading ? t('common.loading') : t('auth.login')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p className="mb-2">Demo credentials:</p>
            <p>Trainer: trainer@example.com</p>
            <p>Student: student@example.com</p>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('auth.register')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
