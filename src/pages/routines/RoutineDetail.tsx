import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import routinesApi, { Routine, WorkoutDay } from '../../api/routines'

export default function RoutineDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!id) return

    let cancelled = false
    setLoading(true)
    setError('')

    const load = async () => {
      try {
        const response = await routinesApi.getRoutine(id)
        if (cancelled) return
        setRoutine(response.routine)
        setWorkoutDays(response.workoutDays || [])
      } catch (error) {
        console.error('Failed to load routine:', error)
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
  }, [id, t])

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('routines.title')}</h1>
          <p className="text-gray-500">{id}</p>
        </div>
        <Link to="/trainer/routines" className="btn btn-secondary">
          {t('common.back')}
        </Link>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">{t('common.loading')}</p>
      ) : error ? (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      ) : !routine ? (
        <p className="text-gray-500 text-center py-8">{t('routines.no_routines')}</p>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{routine.name}</h2>
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700">
              {t(`routines.status.${routine.status.toLowerCase()}`)}
            </span>
          </div>

          {routine.description && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">{t('routines.description')}</p>
              <p className="text-gray-900">{routine.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">{t('routines.duration')}</p>
              <p className="font-semibold">{routine.weekCount} {t('routines.weeks')}</p>
            </div>
            <div>
              <p className="text-gray-600">{t('routines.created')}</p>
              <p className="font-semibold">{new Date(routine.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">{t('routines.workout_days')}</h3>
            {workoutDays.length === 0 ? (
              <p className="text-gray-500">{t('routines.no_workout_days')}</p>
            ) : (
              <div className="space-y-3">
                {workoutDays
                  .slice()
                  .sort((a, b) => (a.weekNumber - b.weekNumber) || (a.dayNumber - b.dayNumber))
                  .map((day) => {
                    const dayKey = `${day.weekNumber}-${day.dayNumber}`
                    const isExpanded = expandedDays.has(dayKey)
                    
                    return (
                      <div key={dayKey} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedDays)
                            if (isExpanded) {
                              newExpanded.delete(dayKey)
                            } else {
                              newExpanded.add(dayKey)
                            }
                            setExpandedDays(newExpanded)
                          }}
                          className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
                            <div className="text-left">
                              <p className="font-medium text-gray-900">
                                {t('routines.week')} {day.weekNumber} • {day.dayName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {day.isRestDay ? t('routines.rest_day') : `${day.exercises.length} ${t('routines.exercises')}`}
                              </p>
                            </div>
                          </div>
                        </button>
                        
                        {isExpanded && !day.isRestDay && day.exercises.length > 0 && (
                          <div className="p-4 bg-white border-t border-gray-200">
                            <div className="space-y-3">
                              {day.exercises.map((exercise, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-start justify-between mb-2">
                                    <p className="font-medium text-gray-900">
                                      {idx + 1}. {exercise.exerciseId}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-600">{t('routines.sets')}: </span>
                                      <span className="font-semibold">{exercise.sets}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">{t('routines.reps')}: </span>
                                      <span className="font-semibold">{exercise.reps}</span>
                                    </div>
                                    {exercise.restSeconds > 0 && (
                                      <div>
                                        <span className="text-gray-600">{t('routines.rest')}: </span>
                                        <span className="font-semibold">{exercise.restSeconds}s</span>
                                      </div>
                                    )}
                                    {exercise.tempo && (
                                      <div>
                                        <span className="text-gray-600">{t('routines.tempo')}: </span>
                                        <span className="font-semibold">{exercise.tempo}</span>
                                      </div>
                                    )}
                                    {exercise.rpe > 0 && (
                                      <div>
                                        <span className="text-gray-600">RPE: </span>
                                        <span className="font-semibold">{exercise.rpe}</span>
                                      </div>
                                    )}
                                  </div>
                                  {exercise.notes && (
                                    <p className="mt-2 text-sm text-gray-600 italic">{exercise.notes}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
