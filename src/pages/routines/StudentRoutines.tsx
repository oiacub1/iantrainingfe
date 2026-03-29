import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { Calendar, Dumbbell, TrendingUp, Play, Clock } from 'lucide-react'
import routinesApi, { Routine, WorkoutDay, RoutineAssignment } from '../../api/routines'

export default function StudentRoutines() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [assignment, setAssignment] = useState<RoutineAssignment | null>(null)
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null)
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      setAssignment(null)
      setActiveRoutine(null)
      setWorkoutDays([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    const load = async () => {
      try {
        const data = await routinesApi.getActiveAssignmentForStudent(user.id)
        if (cancelled) return
        
        if (data) {
          setAssignment(data.assignment)
          setActiveRoutine(data.routine)
          setWorkoutDays(data.workoutDays)
        } else {
          setAssignment(null)
          setActiveRoutine(null)
          setWorkoutDays([])
        }
      } catch (error) {
        console.error('Failed to load active routine:', error)
        if (cancelled) return
        setError(t('routines.load_error'))
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
  }, [user, t])

  const getTodayWorkout = () => {
    if (!assignment || !activeRoutine || workoutDays.length === 0) return null
    
    const today = new Date()
    const startDate = new Date(assignment.startDate)
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const weekNumber = Math.floor(daysDiff / 7) + 1
    const dayNumber = (daysDiff % 7) + 1
    
    return workoutDays.find(day => 
      day.weekNumber === weekNumber && day.dayNumber === dayNumber
    )
  }

  const getWeekProgress = () => {
    if (!assignment || !activeRoutine || workoutDays.length === 0) return 0
    
    const today = new Date()
    const startDate = new Date(assignment.startDate)
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const currentWeek = Math.floor(daysDiff / 7) + 1
    const weekWorkouts = workoutDays.filter(day => day.weekNumber === currentWeek)
    const completedWorkouts = weekWorkouts.filter(day => day.dayNumber <= (daysDiff % 7) + 1)
    
    return weekWorkouts.length > 0 ? (completedWorkouts.length / weekWorkouts.length) * 100 : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('common.welcome')}, {user?.name}
        </h1>
        <p className="text-gray-600">
          {t('students.current_routine')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('workout_log.this_week')}</p>
              <p className="text-3xl font-bold text-gray-900">
                {workoutDays.filter(day => !day.isRestDay).length}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-primary-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('progress.completion_rate')}</p>
              <p className="text-3xl font-bold text-green-600">
                {Math.round(getWeekProgress())}%
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('routines.week')}</p>
              <p className="text-3xl font-bold text-gray-900">
                {assignment ? Math.floor((new Date().getTime() - new Date(assignment.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1 : '-'}
              </p>
            </div>
            <Clock className="w-12 h-12 text-primary-500" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {!activeRoutine ? (
        <div className="card">
          <div className="text-center py-8">
            <Dumbbell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('students.no_routine')}
            </h2>
            <p className="text-gray-500 mb-4">
              {t('students.no_routine_description')}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{activeRoutine.name}</h2>
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                {t('routines.status.active')}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">{t('routines.duration')}</p>
                <p className="font-semibold">{activeRoutine.weekCount} {t('routines.weeks')}</p>
              </div>
              <div>
                <p className="text-gray-600">{t('routines.start_date')}</p>
                <p className="font-semibold">{assignment ? new Date(assignment.startDate).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">{t('routines.end_date')}</p>
                <p className="font-semibold">{assignment ? new Date(assignment.endDate).toLocaleDateString() : '-'}</p>
              </div>
            </div>
          </div>

          {getTodayWorkout() && (
            <div className="card border-l-4 border-primary-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('routines.today_workout')}</h3>
                <button className="btn btn-primary flex items-center space-x-2">
                  <Play className="w-4 h-4" />
                  <span>{t('workout.start')}</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {getTodayWorkout()?.exercises.map((exercise, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Exercise {exercise.order}</p>
                      <p className="text-sm text-gray-600">
                        {exercise.sets} sets × {exercise.reps} reps
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{exercise.restSeconds}s rest</p>
                      <p className="text-xs text-gray-500">RPE: {exercise.rpe}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">{t('routines.this_week')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
              {assignment && workoutDays
                .filter(day => day.weekNumber === Math.floor((new Date().getTime() - new Date(assignment.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1)
                .sort((a, b) => a.dayNumber - b.dayNumber)
                .map((day) => {
                  const isToday = day.dayNumber === (new Date().getDay() || 7)
                  const isCompleted = day.dayNumber < (new Date().getDay() || 7)
                  
                  return (
                    <div
                      key={`${day.weekNumber}-${day.dayNumber}`}
                      className={`p-3 rounded-lg border text-center ${
                        isToday 
                          ? 'border-primary-500 bg-primary-50' 
                          : isCompleted 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <p className="text-xs font-medium text-gray-600 mb-1">
                        {day.dayName}
                      </p>
                      {day.isRestDay ? (
                        <Dumbbell className="w-6 h-6 mx-auto text-gray-400" />
                      ) : (
                        <div className="w-6 h-6 mx-auto rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
                          {day.exercises.length}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
