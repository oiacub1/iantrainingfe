import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { usersApi, TrainerStudent } from '../../api/users'
import { Users, Plus, Dumbbell, Calendar } from 'lucide-react'

export default function TrainerDashboard() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [students, setStudents] = useState<TrainerStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [studentEmail, setStudentEmail] = useState('')
  const [addStudentError, setAddStudentError] = useState('')
  const [isAddingStudent, setIsAddingStudent] = useState(false)

  const loadStudents = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    
    try {
      const data = await usersApi.listStudents(user.id)
      setStudents(data.students)
    } catch (error) {
      console.error('Failed to load students:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const openAddStudent = () => {
    setAddStudentError('')
    setStudentEmail('')
    setIsAddStudentOpen(true)
  }

  const closeAddStudent = () => {
    if (isAddingStudent) return
    setIsAddStudentOpen(false)
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsAddingStudent(true)
    setAddStudentError('')

    try {
      await usersApi.assignStudentByEmail(user.id, studentEmail)
      await loadStudents()
      setIsAddStudentOpen(false)
    } catch (error) {
      console.error('Failed to add student:', error)
      setAddStudentError('No se pudo asignar el estudiante. Revisá el email y volvé a intentar.')
    } finally {
      setIsAddingStudent(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {t('common.welcome')}, {user?.name}
        </h1>
        <p className="text-gray-600">
          {t('trainers.my_students')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('trainers.my_students')}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{students.length}</p>
            </div>
            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-primary-500" />
          </div>
        </div>

        <Link to="/trainer/routines" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('routines.title')}</p>
              <p className="text-lg font-semibold text-primary-600">
                {t('common.manage')}
              </p>
            </div>
            <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-primary-500" />
          </div>
        </Link>

        <Link to="/exercises" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('exercises.title')}</p>
              <p className="text-lg font-semibold text-primary-600">
                {t('common.create')}
              </p>
            </div>
            <Dumbbell className="w-10 h-10 sm:w-12 sm:h-12 text-primary-500" />
          </div>
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-semibold">{t('trainers.my_students')}</h2>
          <button onClick={openAddStudent} className="btn btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            <span>{t('trainers.add_student')}</span>
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">{t('common.loading')}</p>
        ) : students.length === 0 ? (
          <p className="text-center text-gray-500 py-8">{t('trainers.no_students')}</p>
        ) : (
          <div className="space-y-3">
            {students.map((student) => (
              <div
                key={student.studentId}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{student.studentName}</p>
                  <p className="text-sm text-gray-600 truncate">{student.studentEmail}</p>
                </div>
                <Link
                  to={`/students/${student.studentId}`}
                  className="btn btn-outline btn-sm w-full sm:w-auto"
                >
                  {t('common.edit')}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h3 className="text-lg font-semibold">{t('trainers.add_student')}</h3>
              <button onClick={closeAddStudent} className="btn btn-secondary w-full sm:w-auto">
                {t('common.cancel')}
              </button>
            </div>

            {addStudentError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {addStudentError}
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <button type="submit" disabled={isAddingStudent} className="w-full btn btn-primary">
                {isAddingStudent ? t('common.loading') : t('trainers.add_student')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}