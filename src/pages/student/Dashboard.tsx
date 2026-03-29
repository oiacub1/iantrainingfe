import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Calendar, Dumbbell, TrendingUp } from 'lucide-react'
import routinesApi, { Routine, RoutineAssignment } from '../../api/routines'
import { useState, useEffect } from 'react'

interface ActiveRoutineData {
  assignment: RoutineAssignment
  routine: Routine
  workoutDays: any[]
}

export default function StudentDashboard() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [activeRoutineData, setActiveRoutineData] = useState<ActiveRoutineData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setActiveRoutineData(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const load = async () => {
      try {
        const data = await routinesApi.getActiveAssignmentForStudent(user.id)
        if (cancelled) return
        setActiveRoutineData(data)
      } catch (error) {
        console.error('Failed to load active routine:', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {t('common.welcome')}, {user?.name}
        </h1>
        <p className="text-gray-600">
          {t('students.current_routine')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('workout_log.this_week')}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">4</p>
            </div>
            <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-primary-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('progress.completion_rate')}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">85%</p>
            </div>
            <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />
          </div>
        </div>

        <Link to="/student/workout" className="card hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('workout.log_workout')}</p>
              <p className="text-lg font-semibold text-primary-600">
                {t('workout_log.today')}
              </p>
            </div>
            <Dumbbell className="w-10 h-10 sm:w-12 sm:h-12 text-primary-500" />
          </div>
        </Link>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">{t('students.current_routine')}</h2>
        
        {loading ? (
          <p className="text-center text-gray-500 py-8">{t('common.loading')}</p>
        ) : !activeRoutineData ? (
          <p className="text-gray-500 text-center py-8">
            {t('students.no_routine')}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{activeRoutineData.routine.name}</p>
                <p className="text-sm text-gray-600">
                  {activeRoutineData.routine.weekCount} {t('routines.weeks')} • {t('routines.status.active')}
                </p>
                <p className="text-sm text-gray-600">
                  {activeRoutineData.assignment.startDate} - {activeRoutineData.assignment.endDate}
                </p>
              </div>
              <Link
                to="/student/routines"
                className="btn btn-outline btn-sm w-full sm:w-auto"
              >
                {t('common.view')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}