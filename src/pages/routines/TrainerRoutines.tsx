import { useState, useEffect, useCallback } from 'react'
import { Link, useMatch, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { Plus, Calendar, Users, Dumbbell, Edit, Trash2 } from 'lucide-react'
import routinesApi, { Routine, CreateRoutineRequest } from '../../api/routines'
import { usersApi, TrainerStudent } from '../../api/users'
import { exercisesApi, Exercise } from '../../api/exercises'
import AssignRoutineModal from '../../components/AssignRoutineModal'

type ExerciseSetDraft = {
  exerciseId: string
  sets: number
  reps: string
  restSeconds: number
  notes: string
  tempo: string
  rpe: number
}

type WorkoutDayDraft = {
  weekNumber: number
  dayNumber: number
  dayName: string
  isRestDay: boolean
  exercises: ExerciseSetDraft[]
}

export default function TrainerRoutines() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const isCreatePage = useMatch('/trainer/routines/new') !== null
  const [routines, setRoutines] = useState<Routine[]>([])
  const [students, setStudents] = useState<TrainerStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<CreateRoutineRequest>({
    name: '',
    weekCount: 4,
    description: ''
  })
  const [workoutDaysDraft, setWorkoutDaysDraft] = useState<WorkoutDayDraft[]>([
    {
      weekNumber: 1,
      dayNumber: 1,
      dayName: 'Day 1',
      isRestDay: false,
      exercises: [
        {
          exerciseId: '',
          sets: 3,
          reps: '10',
          restSeconds: 90,
          notes: '',
          tempo: '',
          rpe: 0
        }
      ]
    }
  ])
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [exercisesLoading, setExercisesLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Assignment modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null)

  const loadRoutines = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const { routines: data } = await routinesApi.listRoutinesByTrainer(user.id)
      setRoutines(data)
    } catch (error) {
      console.error('Failed to load routines:', error)
      setError(t('routines.load_error'))
    } finally {
      setLoading(false)
    }
  }, [user, t])

  const loadStudents = useCallback(async () => {
    if (!user) return

    try {
      const data = await usersApi.listStudents(user.id)
      setStudents(data.students)
    } catch (error) {
      console.error('Failed to load students:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadRoutines()
      loadStudents()
    }
  }, [user, loadRoutines, loadStudents])

  useEffect(() => {
    if (!user || user.role !== 'TRAINER' || !isCreatePage) return

    let cancelled = false
    setExercisesLoading(true)

    const load = async () => {
      try {
        const data = await exercisesApi.list(user.id)
        if (cancelled) return
        setAvailableExercises(data)
      } catch (error) {
        console.error('Failed to load exercises:', error)
      } finally {
        if (!cancelled) {
          setExercisesLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [user, isCreatePage])

  const getExerciseLabel = (exercise: Exercise) => {
    if (!exercise.nameKey) return exercise.name
    const translated = t(exercise.nameKey)
    return translated === exercise.nameKey ? exercise.name : translated
  }

  const addWorkoutDay = () => {
    setWorkoutDaysDraft((prev) => [
      ...prev,
      {
        weekNumber: 1,
        dayNumber: 1,
        dayName: `${t('routines.day')} 1`,
        isRestDay: false,
        exercises: [
          {
            exerciseId: '',
            sets: 3,
            reps: '10',
            restSeconds: 90,
            notes: '',
            tempo: '',
            rpe: 0
          }
        ]
      }
    ])
  }

  const removeWorkoutDay = (index: number) => {
    setWorkoutDaysDraft((prev) => prev.filter((_, i) => i !== index))
  }

  const updateWorkoutDay = (index: number, next: Partial<WorkoutDayDraft>) => {
    setWorkoutDaysDraft((prev) => prev.map((d, i) => (i === index ? { ...d, ...next } : d)))
  }

  const addExerciseToDay = (dayIndex: number) => {
    setWorkoutDaysDraft((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d
        return {
          ...d,
          exercises: [
            ...d.exercises,
            { exerciseId: '', sets: 3, reps: '10', restSeconds: 90, notes: '', tempo: '', rpe: 0 }
          ]
        }
      })
    )
  }

  const removeExerciseFromDay = (dayIndex: number, exerciseIndex: number) => {
    setWorkoutDaysDraft((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d
        return { ...d, exercises: d.exercises.filter((_, ei) => ei !== exerciseIndex) }
      })
    )
  }

  const updateExerciseInDay = (dayIndex: number, exerciseIndex: number, next: Partial<ExerciseSetDraft>) => {
    setWorkoutDaysDraft((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d
        return {
          ...d,
          exercises: d.exercises.map((ex, ei) => (ei === exerciseIndex ? { ...ex, ...next } : ex))
        }
      })
    )
  }

  const handleCreateRoutineSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    setError('')

    try {
      const normalizedWorkoutDays = workoutDaysDraft
        .map((d) => ({
          ...d,
          weekNumber: Number(d.weekNumber),
          dayNumber: Number(d.dayNumber),
          dayName: d.dayName.trim() || `${t('routines.day')} ${d.dayNumber}`,
          exercises: d.isRestDay
            ? []
            : d.exercises.map((ex) => ({
                ...ex,
                sets: Number(ex.sets),
                restSeconds: Number(ex.restSeconds),
                rpe: Number(ex.rpe)
              }))
        }))
        .filter((d) => d.weekNumber >= 1 && d.dayNumber >= 1 && d.dayName !== '')

      for (const day of normalizedWorkoutDays) {
        if (day.weekNumber > formData.weekCount) {
          setError(t('routines.plan_validation_error'))
          setIsSubmitting(false)
          return
        }
        if (day.dayNumber > 7) {
          setError(t('routines.plan_validation_error'))
          setIsSubmitting(false)
          return
        }
        if (!day.isRestDay) {
          if (day.exercises.length === 0) {
            setError(t('routines.plan_validation_error'))
            setIsSubmitting(false)
            return
          }
          for (const ex of day.exercises) {
            if (!ex.exerciseId || !ex.reps || ex.sets <= 0 || ex.restSeconds < 0) {
              setError(t('routines.plan_validation_error'))
              setIsSubmitting(false)
              return
            }
          }
        }
      }

      let created: Routine | null = null
      try {
        created = await routinesApi.createRoutine(user.id, formData)

        for (const day of normalizedWorkoutDays) {
          await routinesApi.createWorkoutDay(user.id, created.id, {
            weekNumber: day.weekNumber,
            dayNumber: day.dayNumber,
            dayName: day.dayName,
            isRestDay: day.isRestDay,
            exercises: day.isRestDay
              ? []
              : day.exercises.map((ex, index) => ({
                  exerciseId: ex.exerciseId,
                  order: index + 1,
                  sets: ex.sets,
                  reps: ex.reps,
                  restSeconds: ex.restSeconds,
                  notes: ex.notes,
                  tempo: ex.tempo,
                  rpe: ex.rpe
                }))
          })
        }
      } catch (error) {
        if (created) {
          try {
            await routinesApi.deleteRoutine(user.id, created.id)
          } catch (deleteError) {
            console.error('Failed to rollback routine after workout day creation error:', deleteError)
          }
        }
        throw error
      }

      await loadRoutines()
      navigate(`/routines/${created.id}`)
    } catch (error) {
      console.error('Failed to create routine:', error)
      setError(t('routines.create_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRoutine = async (routineId: string) => {
    if (!user) return

    if (!window.confirm(t('routines.delete_confirm'))) return

    try {
      await routinesApi.deleteRoutine(user.id, routineId)
      await loadRoutines()
    } catch (error) {
      console.error('Failed to delete routine:', error)
      setError(t('routines.delete_error'))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-100'
      case 'DRAFT':
        return 'text-gray-600 bg-gray-100'
      case 'COMPLETED':
        return 'text-blue-600 bg-blue-100'
      case 'ARCHIVED':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    )
  }

  if (isCreatePage) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('routines.create_routine')}</h1>
            <p className="text-gray-600">{t('routines.create_description')}</p>
          </div>
          <Link to="/trainer/routines" className="btn btn-secondary">
            {t('common.back')}
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="card max-w-xl">
          {students.length === 0 ? (
            <p className="text-gray-600">{t('routines.add_students_first')}</p>
          ) : (
            <form onSubmit={handleCreateRoutineSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('routines.name')}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('routines.description')}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder={t('routines.description_placeholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('routines.week_count')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={formData.weekCount}
                  onChange={(e) => setFormData({ ...formData, weekCount: parseInt(e.target.value) })}
                  className="input"
                  required
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">{t('routines.workout_plan')}</h3>
                  <button type="button" onClick={addWorkoutDay} className="btn btn-secondary">
                    {t('common.add')}
                  </button>
                </div>

                {exercisesLoading ? (
                  <p className="text-sm text-gray-500">{t('common.loading')}</p>
                ) : availableExercises.length === 0 ? (
                  <p className="text-sm text-gray-500">{t('routines.no_exercises_available')}</p>
                ) : null}

                <div className="space-y-4">
                  {workoutDaysDraft.map((day, dayIndex) => (
                    <div key={dayIndex} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('routines.week_number')}
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={formData.weekCount}
                              value={day.weekNumber}
                              onChange={(e) => updateWorkoutDay(dayIndex, { weekNumber: parseInt(e.target.value) })}
                              className="input"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('routines.day_number')}
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="7"
                              value={day.dayNumber}
                              onChange={(e) => updateWorkoutDay(dayIndex, { dayNumber: parseInt(e.target.value) })}
                              className="input"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('routines.day_name')}
                            </label>
                            <input
                              name="dayName"
                              value={day.dayName}
                              onChange={(e) => updateWorkoutDay(dayIndex, { dayName: e.target.value })}
                              className="input"
                              required
                            />
                          </div>
                        </div>

                        <button type="button" onClick={() => removeWorkoutDay(dayIndex)} className="btn btn-danger btn-sm">
                          {t('common.remove')}
                        </button>
                      </div>

                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={day.isRestDay}
                          onChange={(e) =>
                            updateWorkoutDay(dayIndex, { isRestDay: e.target.checked, exercises: e.target.checked ? [] : day.exercises })
                          }
                        />
                        <span>{t('routines.is_rest_day')}</span>
                      </label>

                      {!day.isRestDay && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-700">{t('routines.exercises')}</p>
                            <button type="button" onClick={() => addExerciseToDay(dayIndex)} className="btn btn-secondary btn-sm">
                              {t('routines.add_exercise')}
                            </button>
                          </div>

                          {day.exercises.length === 0 ? (
                            <p className="text-sm text-gray-500">{t('routines.add_exercises_hint')}</p>
                          ) : (
                            <div className="space-y-3">
                              {day.exercises.map((ex, exerciseIndex) => (
                                <div key={exerciseIndex} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                                  <div className="md:col-span-5">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {t('routines.exercise')}
                                    </label>
                                    <select
                                      name="exerciseId"
                                      value={ex.exerciseId}
                                      onChange={(e) => updateExerciseInDay(dayIndex, exerciseIndex, { exerciseId: e.target.value })}
                                      className="input"
                                      required
                                    >
                                      <option value="">{t('routines.select_exercise')}</option>
                                      {availableExercises.map((option) => (
                                        <option key={option.id} value={option.id}>
                                          {getExerciseLabel(option)}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {t('routines.sets')}
                                    </label>
                                    <input
                                      type="number"
                                      name="sets"
                                      min="1"
                                      value={ex.sets}
                                      onChange={(e) => updateExerciseInDay(dayIndex, exerciseIndex, { sets: parseInt(e.target.value) })}
                                      className="input"
                                      required
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {t('routines.reps')}
                                    </label>
                                    <input
                                      name="reps"
                                      value={ex.reps}
                                      onChange={(e) => updateExerciseInDay(dayIndex, exerciseIndex, { reps: e.target.value })}
                                      className="input"
                                      required
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {t('routines.rest_seconds')}
                                    </label>
                                    <input
                                      type="number"
                                      name="restSeconds"
                                      min="0"
                                      value={ex.restSeconds}
                                      onChange={(e) =>
                                        updateExerciseInDay(dayIndex, exerciseIndex, { restSeconds: parseInt(e.target.value) })
                                      }
                                      className="input"
                                      required
                                    />
                                  </div>
                                  <div className="md:col-span-1 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => removeExerciseFromDay(dayIndex, exerciseIndex)}
                                      className="btn btn-danger btn-sm"
                                    >
                                      {t('common.remove')}
                                    </button>
                                  </div>

                                  <div className="md:col-span-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {t('routines.notes')}
                                    </label>
                                    <input
                                      value={ex.notes}
                                      onChange={(e) => updateExerciseInDay(dayIndex, exerciseIndex, { notes: e.target.value })}
                                      className="input"
                                    />
                                  </div>
                                  <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {t('routines.tempo')}
                                    </label>
                                    <input
                                      value={ex.tempo}
                                      onChange={(e) => updateExerciseInDay(dayIndex, exerciseIndex, { tempo: e.target.value })}
                                      className="input"
                                    />
                                  </div>
                                  <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {t('routines.rpe')}
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="10"
                                      value={ex.rpe}
                                      onChange={(e) => updateExerciseInDay(dayIndex, exerciseIndex, { rpe: parseInt(e.target.value) })}
                                      className="input"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full btn btn-primary">
                {isSubmitting ? t('common.loading') : t('routines.create')}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('routines.title')}</h1>
          <p className="text-gray-600">{t('routines.description')}</p>
        </div>
        {students.length === 0 ? (
          <button className="btn btn-primary flex items-center space-x-2" disabled>
            <Plus className="w-4 h-4" />
            <span>{t('routines.create')}</span>
          </button>
        ) : (
          <Link to="/trainer/routines/new" className="btn btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>{t('routines.create')}</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('routines.total_routines')}</p>
              <p className="text-3xl font-bold text-gray-900">{routines.length}</p>
            </div>
            <Calendar className="w-12 h-12 text-primary-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('routines.active_routines')}</p>
              <p className="text-3xl font-bold text-green-600">
                {routines.filter(r => r.status === 'ACTIVE').length}
              </p>
            </div>
            <Dumbbell className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('trainers.my_students')}</p>
              <p className="text-3xl font-bold text-gray-900">{students.length}</p>
            </div>
            <Users className="w-12 h-12 text-primary-500" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">{t('routines.my_routines')}</h2>
        
        {routines.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">{t('routines.no_routines')}</p>
            {students.length === 0 ? (
              <p className="text-sm text-gray-400">
                {t('routines.add_students_first')}
              </p>
            ) : (
              <Link to="/trainer/routines/new" className="btn btn-primary">
                {t('routines.create_first')}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {routines.map((routine) => {
              return (
                <div
                  key={routine.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {routine.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(routine.status)}`}>
                          {t(`routines.status.${routine.status.toLowerCase()}`)}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        {routine.description && (
                          <p className="text-gray-700">{routine.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {t('routines.created')}: {new Date(routine.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 ml-0 sm:ml-4">
                      <Link
                        to={`/routines/${routine.id}/edit`}
                        className="btn btn-outline btn-sm flex items-center justify-center space-x-1 w-full sm:w-auto"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('common.edit')}</span>
                        <span className="sm:hidden">{t('common.edit')}</span>
                      </Link>
                      <button
                        onClick={() => handleDeleteRoutine(routine.id)}
                        className="btn btn-danger-sm btn-sm flex items-center justify-center space-x-1 w-full sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{t('common.delete')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {assignModalOpen && selectedRoutineId && user && (
        <AssignRoutineModal
          routineId={selectedRoutineId}
          trainerId={user.id}
          onClose={() => {
            setAssignModalOpen(false)
            setSelectedRoutineId(null)
          }}
          onSuccess={() => {
            loadRoutines()
          }}
        />
      )}
    </div>
  )
}
