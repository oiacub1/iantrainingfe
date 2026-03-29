import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { Dumbbell } from 'lucide-react'
import axios from 'axios'
import { authApi } from '../api/auth'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'STUDENT' | 'TRAINER'>('STUDENT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError(t('auth.password_mismatch'))
      return
    }

    if (password.length < 6) {
      setError(t('auth.password_too_short'))
      return
    }

    setLoading(true)

    try {
      const userData = {
        name,
        email,
        password,
        role,
        phone: '',
        fitnessLevel: role === 'STUDENT' ? 'BEGINNER' : undefined,
        goals: role === 'STUDENT' ? [] : undefined,
      }

      const response = await authApi.register(userData)
      
      if (response.user && response.accessToken) {
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
      } else {
        navigate('/login', { 
          state: { message: 'Usuario creado exitosamente. Por favor inicia sesión.' }
        })
      }
    } catch (err: unknown) {
      console.error('Registration failed:', err)

      const status = axios.isAxiosError(err) ? err.response?.status : undefined
      const responseData = axios.isAxiosError(err) ? err.response?.data : undefined
      const responseError =
        typeof responseData === 'object' &&
        responseData !== null &&
        'error' in responseData &&
        typeof (responseData as { error?: unknown }).error === 'string'
          ? (responseData as { error: string }).error
          : undefined

      if (status === 400) {
        if (responseError?.includes('email')) {
          setError('Este email ya está registrado')
        } else {
          setError('Por favor completa todos los campos correctamente')
        }
      } else if (typeof status === 'number' && status >= 500) {
        setError('Error del servidor. Intenta nuevamente más tarde')
      } else {
        setError('Error al registrarse. Intenta nuevamente')
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
            {t('auth.create_account')}
          </p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            {t('auth.register')}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.name')}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder={t('auth.name_placeholder')}
                required
              />
            </div>

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
                placeholder="tu@email.com"
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
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.confirm_password')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.role')}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="STUDENT"
                    checked={role === 'STUDENT'}
                    onChange={(e) => setRole(e.target.value as 'STUDENT')}
                    className="mr-2"
                  />
                  <span>{t('auth.student')}</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="TRAINER"
                    checked={role === 'TRAINER'}
                    onChange={(e) => setRole(e.target.value as 'TRAINER')}
                    className="mr-2"
                  />
                  <span>{t('auth.trainer')}</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary"
            >
              {loading ? t('common.loading') : t('auth.register')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {t('auth.already_have_account')}{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('auth.login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
