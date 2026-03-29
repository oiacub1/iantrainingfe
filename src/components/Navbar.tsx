import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { Dumbbell, LogOut, User, Globe, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'es' : 'en'
    i18n.changeLanguage(newLang)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="container-app">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Dumbbell className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">
              {t('common.app_name')}
            </span>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
              title="Change language"
            >
              <Globe className="w-5 h-5" />
            </button>

            {user && (
              <>
                <div className="hidden lg:flex items-center space-x-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{user.name}</span>
                  <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                    {t(`roles.${user.role.toLowerCase()}`)}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('auth.logout')}</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {user && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm py-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 font-medium">{user.name}</span>
                  <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                    {t(`roles.${user.role.toLowerCase()}`)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={toggleLanguage}
                    className="flex items-center space-x-2 p-2 text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    <span>{t('common.change_language')}</span>
                  </button>
                </div>

                <button
                  onClick={logout}
                  className="flex items-center space-x-2 w-full p-2 text-gray-700 hover:text-red-600 transition-colors border-t border-gray-100 pt-4"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('auth.logout')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}